import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { CanvasTexture, Matrix4, Vector3 } from 'three';
import type { Group } from 'three';
import {
  markDonationDisplayed,
  useDonationFeed,
  useFeedHydrated,
  type FeedDonation,
} from '../lib/donationFeed';
import {
  DEFAULT_PRELIT_ATHLETES,
  GLOBE_RADIUS,
  getSphereLayout,
  PERSON_POINT_COUNT,
} from '../lib/sphereLayout';
import { EURO_PER_LIT_ATHLETE as EURO_PER_LIT_ATHLETE_VALUE } from '../lib/donations';
import './DonationSphere.css';

export {
  DEFAULT_PRELIT_ATHLETES,
  GLOBE_RADIUS,
  PERSON_POINT_COUNT,
} from '../lib/sphereLayout';
export const EURO_PER_LIT_ATHLETE = EURO_PER_LIT_ATHLETE_VALUE;

interface PointData {
  positions: Float32Array;
  revealOrder: number[];
}

interface DonationLightView {
  id: string;
  pointIndex: number;
  x: number;
  y: number;
  z: number;
  donorAlias: string | null;
  mine: boolean;
}

/** Only one donor name on the globe at a time. */
const DONOR_LABEL_MAX_VISIBLE_MS = 2000;
const DONOR_LABEL_EXIT_MS = 280;

interface DonorLabelOverlay {
  light: DonationLightView;
  leaving: boolean;
}

function toDonationLightView(donation: FeedDonation): DonationLightView {
  return {
    id: donation.id,
    pointIndex: donation.pointIndex,
    x: donation.x,
    y: donation.y,
    z: donation.z,
    donorAlias: donation.donorAlias,
    mine: donation.mine,
  };
}

function formatDonorDisplayName(name: string | null): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return 'Supporter';
  return trimmed.length > 22 ? `${trimmed.slice(0, 20)}…` : trimmed;
}

function labelPosition(x: number, y: number, z: number): [number, number, number] {
  const len = Math.sqrt(x * x + y * y + z * z) || 1;
  const offset = 0.1;
  return [(x / len) * (len + offset), (y / len) * (len + offset), (z / len) * (len + offset)];
}

function DonorGlobeLabel({
  light,
  pulseBoost,
  isPulsing,
  leaving,
}: {
  light: DonationLightView;
  pulseBoost: number;
  isPulsing: boolean;
  leaving: boolean;
}) {
  const [lx, ly, lz] = labelPosition(light.x, light.y, light.z);
  const scale = 1 + (isPulsing && !leaving ? pulseBoost * 0.14 : 0);

  return (
    <Html position={[lx, ly, lz]} center distanceFactor={4.2} zIndexRange={[40, 0]} occlude={false}>
      <span
        className={[
          'donor-globe-label',
          light.mine ? 'is-mine' : 'is-other',
          leaving ? 'is-leaving' : 'is-visible',
          isPulsing && !leaving ? 'is-pulsing' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ transform: `scale(${scale})` }}
      >
        {formatDonorDisplayName(light.donorAlias)}
      </span>
    </Html>
  );
}

function seededRandom(seed: number): number {
  const value = Math.sin(seed * 913.13) * 10000;
  return value - Math.floor(value);
}

function buildPersonTexture(): CanvasTexture | null {
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 12;

  ctx.beginPath();
  ctx.arc(48, 20, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(24, 38);
  ctx.lineTo(72, 38);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(48, 32);
  ctx.lineTo(48, 66);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(48, 66);
  ctx.lineTo(34, 86);
  ctx.moveTo(48, 66);
  ctx.lineTo(62, 86);
  ctx.stroke();

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

interface SpinningPointSphereProps {
  data: PointData;
  revealOrder: number[];
  defaultLitCount: number;
  visibleDonationLights: DonationLightView[];
  donorLabelOverlays: DonorLabelOverlay[];
  paused: boolean;
  meteorPointIndex: number | null;
  meteorProgress: number;
  meteorIsMine: boolean;
  meteorLaunchInverseMatrix: number[];
  meteorArcVerticalBias: number;
  meteorArcSideBias: number;
  cameraDistance: number;
  pulsePointIndex: number | null;
  pulseProgress: number;
  sphereScale: number;
  onTransformSample: (qx: number, qy: number, qz: number, qw: number, inverseMatrix: number[]) => void;
}

function SpinningPointSphere({
  data,
  revealOrder,
  defaultLitCount,
  visibleDonationLights,
  donorLabelOverlays,
  paused,
  meteorPointIndex,
  meteorProgress,
  meteorIsMine,
  meteorLaunchInverseMatrix,
  meteorArcVerticalBias,
  meteorArcSideBias,
  cameraDistance,
  pulsePointIndex,
  pulseProgress,
  sphereScale,
  onTransformSample,
}: SpinningPointSphereProps) {
  const groupRef = useRef<Group>(null);
  const { positions } = data;
  const totalPoints = revealOrder.length;
  const pointSize = totalPoints >= 7000 ? 0.082 : 0.03;

  const {
    baseLitPositions,
    sponsoredLitPositions,
    emptyPositions,
    glowPositions,
    pulseHighlightPositions,
    pulseBoost,
    meteorPositions,
    meteorHeadScale,
  } =
    useMemo(() => {
    const baseLitThreshold = Math.min(Math.max(defaultLitCount, 0), totalPoints);
    const isLitByPoint = new Uint8Array(totalPoints);
      const isSponsoredByPoint = new Uint8Array(totalPoints);
    for (let i = 0; i < baseLitThreshold; i++) {
        const pointIndex = revealOrder[i];
        isLitByPoint[pointIndex] = 1;
    }
    for (const light of visibleDonationLights) {
        isLitByPoint[light.pointIndex] = 1;
        if (light.mine) {
          isSponsoredByPoint[light.pointIndex] = 1;
        }
    }

    let waveUnitX = 0;
    let waveUnitY = 0;
    let waveUnitZ = 1;
    let waveAngle = 0;
    let waveEnvelope = 0;
    const waveSigma = 0.34;
    const waveAmplitude = 0.135;
    const hasWave = pulsePointIndex !== null;

    if (hasWave && pulsePointIndex !== null) {
      const px = positions[pulsePointIndex * 3];
      const py = positions[pulsePointIndex * 3 + 1];
      const pz = positions[pulsePointIndex * 3 + 2];
      const pr = Math.sqrt(px * px + py * py + pz * pz) || 1;
      waveUnitX = px / pr;
      waveUnitY = py / pr;
      waveUnitZ = pz / pr;
      waveAngle = pulseProgress * Math.PI;
      waveEnvelope = Math.sin(pulseProgress * Math.PI);
    }

    const displacedPoint = (pointIndex: number): [number, number, number, number] => {
      const x = positions[pointIndex * 3];
      const y = positions[pointIndex * 3 + 1];
      const z = positions[pointIndex * 3 + 2];
      if (!hasWave) return [x, y, z, 0];

      const r = Math.sqrt(x * x + y * y + z * z) || 1;
      const dot = (waveUnitX * x + waveUnitY * y + waveUnitZ * z) / r;
      const clamped = Math.max(-1, Math.min(1, dot));
      const angularDistance = Math.acos(clamped);
      const distanceToBand = angularDistance - waveAngle;
      const gaussianBand = Math.exp(-(distanceToBand * distanceToBand) / (2 * waveSigma * waveSigma));
      // Keep a subtle global pulse so waves remain visible even when the origin
      // starts on the back side of the globe.
      const globalDisplacement = waveAmplitude * 0.18 * waveEnvelope;
      const localDisplacement = waveAmplitude * waveEnvelope * gaussianBand;
      const displacement = globalDisplacement + localDisplacement;
      const scale = 1 + displacement;
      return [x * scale, y * scale, z * scale, angularDistance];
    };

    const baseLitCoords: number[] = [];
    const sponsoredLitCoords: number[] = [];
    const emptyCoords: number[] = [];
    for (let i = 0; i < totalPoints; i++) {
      const [dx, dy, dz] = displacedPoint(i);
      if (isLitByPoint[i]) {
        if (isSponsoredByPoint[i]) {
          sponsoredLitCoords.push(dx, dy, dz);
        } else {
          baseLitCoords.push(dx, dy, dz);
        }
      } else {
        emptyCoords.push(dx, dy, dz);
      }
    }

    const glowCoords: number[] = [];
    const glowTail = visibleDonationLights.slice(-120);
    for (const light of glowTail) {
      const [dx, dy, dz] = displacedPoint(light.pointIndex);
      glowCoords.push(dx, dy, dz);
    }

    const pulseCoords: number[] = [];
    if (hasWave && pulsePointIndex !== null && isLitByPoint[pulsePointIndex]) {
      const [dx, dy, dz] = displacedPoint(pulsePointIndex);
      pulseCoords.push(dx, dy, dz);
    }

    const meteorCoords: number[] = [];
    let meteorHeadScale = 1;
    if (meteorPointIndex !== null) {
      const tx = positions[meteorPointIndex * 3];
      const ty = positions[meteorPointIndex * 3 + 1];
      const tz = positions[meteorPointIndex * 3 + 2];
      const t = Math.max(0, Math.min(1, meteorProgress));
      const easedT = 1 - (1 - t) * (1 - t);
      // Convert camera-front spawn to the sphere's local space at launch time,
      // so it always feels like it comes from the user's eyes.
      const launchInverse = new Matrix4().fromArray(meteorLaunchInverseMatrix);
      const worldStart = new Vector3(0, 0, cameraDistance - 0.32);
      const startLocal = worldStart.applyMatrix4(launchInverse);
      const worldUpSample = new Vector3(0, 1, cameraDistance - 0.32);
      const upLocalSample = worldUpSample.applyMatrix4(launchInverse);
      const sx = startLocal.x;
      const sy = startLocal.y;
      const sz = startLocal.z;
      const baseX = sx + (tx - sx) * easedT;
      const baseY = sy + (ty - sy) * easedT;
      const baseZ = sz + (tz - sz) * easedT;

      // Add a curved path with explicit up/down variance relative to screen-up direction.
      const dirX = tx - sx;
      const dirY = ty - sy;
      const dirZ = tz - sz;
      const dirLen = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ) || 1;
      const ux = dirX / dirLen;
      const uy = dirY / dirLen;
      const uz = dirZ / dirLen;
      const screenUpX = upLocalSample.x - startLocal.x;
      const screenUpY = upLocalSample.y - startLocal.y;
      const screenUpZ = upLocalSample.z - startLocal.z;
      const proj = screenUpX * ux + screenUpY * uy + screenUpZ * uz;
      let orthoUpX = screenUpX - ux * proj;
      let orthoUpY = screenUpY - uy * proj;
      let orthoUpZ = screenUpZ - uz * proj;
      let orthoUpLen = Math.sqrt(orthoUpX * orthoUpX + orthoUpY * orthoUpY + orthoUpZ * orthoUpZ);
      if (orthoUpLen < 1e-4) {
        orthoUpX = 0;
        orthoUpY = 1;
        orthoUpZ = 0;
        orthoUpLen = 1;
      }
      orthoUpX /= orthoUpLen;
      orthoUpY /= orthoUpLen;
      orthoUpZ /= orthoUpLen;

      let rightX = uy * orthoUpZ - uz * orthoUpY;
      let rightY = uz * orthoUpX - ux * orthoUpZ;
      let rightZ = ux * orthoUpY - uy * orthoUpX;
      const rightLen = Math.sqrt(rightX * rightX + rightY * rightY + rightZ * rightZ) || 1;
      rightX /= rightLen;
      rightY /= rightLen;
      rightZ /= rightLen;

      const verticalBias = meteorArcVerticalBias;
      const sideBias = meteorArcSideBias;
      const arcAmplitude = GLOBE_RADIUS * (0.13 + seededRandom(meteorPointIndex * 97 + 5) * 0.14);
      const arcWeight = Math.sin(Math.PI * easedT);
      const offsetX = (orthoUpX * verticalBias + rightX * sideBias * 0.45) * arcAmplitude * arcWeight;
      const offsetY = (orthoUpY * verticalBias + rightY * sideBias * 0.45) * arcAmplitude * arcWeight;
      const offsetZ = (orthoUpZ * verticalBias + rightZ * sideBias * 0.45) * arcAmplitude * arcWeight;

      const mx = baseX + offsetX;
      const my = baseY + offsetY;
      const mz = baseZ + offsetZ;
      meteorCoords.push(mx, my, mz);

      // Perspective-first sizing: very large at launch, then continuously shrinks as it travels away.
      const perspectiveShrink = 1 - Math.pow(easedT, 0.72);
      meteorHeadScale = 1.35 + perspectiveShrink * 8.15;
    }

    return {
      baseLitPositions: new Float32Array(baseLitCoords),
      sponsoredLitPositions: new Float32Array(sponsoredLitCoords),
      emptyPositions: new Float32Array(emptyCoords),
      glowPositions: new Float32Array(glowCoords),
      pulseHighlightPositions: new Float32Array(pulseCoords),
      pulseBoost: Math.sin(Math.max(0, Math.min(1, pulseProgress)) * Math.PI),
      meteorPositions: new Float32Array(meteorCoords),
      meteorHeadScale,
    };
  }, [
    defaultLitCount,
    visibleDonationLights,
    cameraDistance,
    meteorLaunchInverseMatrix,
    meteorArcSideBias,
    meteorArcVerticalBias,
    meteorPointIndex,
    meteorProgress,
    positions,
    pulsePointIndex,
    pulseProgress,
    revealOrder,
    totalPoints,
  ]);

  const personTexture = useMemo(() => buildPersonTexture(), []);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    if (!paused) {
      group.rotation.y += delta * 0.045;
    }
    const wobble = Math.sin(state.clock.elapsedTime * 0.1) * 0.04;
    group.rotation.x += (wobble - group.rotation.x) * 0.06;
    group.updateMatrixWorld(true);
    const inverse = group.matrixWorld.clone().invert().elements;
    onTransformSample(group.quaternion.x, group.quaternion.y, group.quaternion.z, group.quaternion.w, [...inverse]);
  });

  return (
    <group ref={groupRef} scale={[sphereScale, sphereScale, sphereScale]}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[emptyPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={pointSize}
          color="#c8c8c8"
          transparent
          opacity={0.2}
          depthWrite={false}
          map={personTexture ?? undefined}
          alphaTest={0.08}
          toneMapped={false}
        />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[baseLitPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={pointSize}
          color="#ff2b4f"
          transparent
          opacity={1}
          depthWrite
          map={personTexture ?? undefined}
          alphaTest={0.08}
          toneMapped={false}
        />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sponsoredLitPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={pointSize * 1.38}
          color="#111111"
          transparent
          opacity={1}
          depthWrite
          map={personTexture ?? undefined}
          alphaTest={0.08}
          toneMapped={false}
        />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pulseHighlightPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={pointSize * (1.5 + pulseBoost * 0.95)}
          color="#ffe08a"
          transparent
          opacity={0.72 + pulseBoost * 0.26}
          depthWrite={false}
          map={personTexture ?? undefined}
          alphaTest={0.05}
          toneMapped={false}
        />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[meteorPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={pointSize * meteorHeadScale}
          color={meteorIsMine ? '#111111' : '#ff2b4f'}
          transparent
          opacity={0.98}
          depthWrite={false}
          map={personTexture ?? undefined}
          alphaTest={0.05}
          toneMapped={false}
        />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[glowPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={pointSize * 1.22}
          color="#ffe08a"
          transparent
          opacity={0.5}
          depthWrite={false}
          map={personTexture ?? undefined}
          alphaTest={0.05}
          toneMapped={false}
        />
      </points>
      {donorLabelOverlays.map(({ light, leaving }) => (
        <DonorGlobeLabel
          key={light.id}
          light={light}
          leaving={leaving}
          isPulsing={!leaving && pulsePointIndex === light.pointIndex}
          pulseBoost={pulseBoost}
        />
      ))}
    </group>
  );
}

interface DonationSphereProps {
  onIntroComplete?: () => void;
  suppressPulse?: boolean;
}

export function DonationSphere({ onIntroComplete, suppressPulse = false }: DonationSphereProps) {
  const donations = useDonationFeed();
  const feedHydrated = useFeedHydrated();
  const baselineLitCount = Math.min(DEFAULT_PRELIT_ATHLETES, PERSON_POINT_COUNT);
  const pointData = useMemo(() => getSphereLayout(), []);
  const revealOrder = pointData.revealOrder;

  // Each feed row is one lit athlete with stored x,y,z (no overlap — unique point_index in DB).
  const targetDonationLights = donations.length;

  const [revealVersion, setRevealVersion] = useState(0);
  const [meteorPointIndex, setMeteorPointIndex] = useState<number | null>(null);
  const [meteorProgress, setMeteorProgress] = useState(1);
  const [meteorIsMine, setMeteorIsMine] = useState(true);
  const [meteorArcVerticalBias, setMeteorArcVerticalBias] = useState(0.9);
  const [meteorArcSideBias, setMeteorArcSideBias] = useState(0);
  const [meteorLaunchInverseMatrix, setMeteorLaunchInverseMatrix] = useState<number[]>([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
  const [pulsePointIndex, setPulsePointIndex] = useState<number | null>(null);
  const [pulseProgress, setPulseProgress] = useState(1);
  const [donorLabelOverlays, setDonorLabelOverlays] = useState<DonorLabelOverlay[]>([]);
  const labelExitTimeoutRef = useRef<Map<string, number>>(new Map());
  const labelHideScheduleRef = useRef<number | null>(null);
  const activeLabelIdRef = useRef<string | null>(null);
  const queuedDonationIdsRef = useRef<Set<string>>(new Set());
  const bumpReveal = useCallback(() => setRevealVersion((version) => version + 1), []);
  const introDoneRef = useRef(false);
  const introNotifiedRef = useRef(false);
  const suppressPulseRef = useRef(suppressPulse);
  const onIntroCompleteRef = useRef(onIntroComplete);
  const cameraDistanceRef = useRef(2.6);
  const donationsRef = useRef(donations);
  const sphereTransformRef = useRef({
    quaternion: { x: 0, y: 0, z: 0, w: 1 },
    inverseMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] as number[],
  });
  const [viewportSize, setViewportSize] = useState(() => ({
    width: typeof window === 'undefined' ? 390 : window.innerWidth,
    height: typeof window === 'undefined' ? 844 : window.innerHeight,
  }));

  useEffect(() => {
    donationsRef.current = donations;
  }, [donations]);

  const visibleDonationLights = useMemo(
    (): DonationLightView[] =>
      donations
        .filter((light) => light.displayed || queuedDonationIdsRef.current.has(light.id))
        .map((light) => ({
          id: light.id,
          pointIndex: light.pointIndex,
          x: light.x,
          y: light.y,
          z: light.z,
          donorAlias: light.donorAlias,
          mine: light.mine,
        })),
    [donations, revealVersion],
  );

  // Undisplayed count ignores queue state so meteor impact + reveal does not
  // restart the animation effect and cancel the post-impact wave.
  const undisplayedDonationCount = useMemo(
    () => donations.filter((donation) => !donation.displayed).length,
    [donations],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateViewport = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  useEffect(() => {
    suppressPulseRef.current = suppressPulse;
  }, [suppressPulse]);

  useEffect(() => {
    onIntroCompleteRef.current = onIntroComplete;
  }, [onIntroComplete]);

  const clearLabelExitTimeout = useCallback((id: string) => {
    const timeoutId = labelExitTimeoutRef.current.get(id);
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      labelExitTimeoutRef.current.delete(id);
    }
  }, []);

  const hideDonorLabel = useCallback(
    (id: string) => {
      if (labelHideScheduleRef.current !== null) {
        window.clearTimeout(labelHideScheduleRef.current);
        labelHideScheduleRef.current = null;
      }
      clearLabelExitTimeout(id);

      setDonorLabelOverlays((prev) => {
        if (!prev.length || prev[0].light.id !== id) return prev;
        return [{ ...prev[0], leaving: true }];
      });

      const timeoutId = window.setTimeout(() => {
        setDonorLabelOverlays((prev) => (prev[0]?.light.id === id ? [] : prev));
        labelExitTimeoutRef.current.delete(id);
        if (activeLabelIdRef.current === id) activeLabelIdRef.current = null;
      }, DONOR_LABEL_EXIT_MS);
      labelExitTimeoutRef.current.set(id, timeoutId);
    },
    [clearLabelExitTimeout],
  );

  const showDonorLabel = useCallback(
    (light: DonationLightView) => {
      const previousId = activeLabelIdRef.current;
      if (previousId && previousId !== light.id) {
        clearLabelExitTimeout(previousId);
      }
      if (labelHideScheduleRef.current !== null) {
        window.clearTimeout(labelHideScheduleRef.current);
        labelHideScheduleRef.current = null;
      }

      activeLabelIdRef.current = light.id;
      setDonorLabelOverlays([{ light, leaving: false }]);

      const visibleMs = Math.max(0, DONOR_LABEL_MAX_VISIBLE_MS - DONOR_LABEL_EXIT_MS);
      labelHideScheduleRef.current = window.setTimeout(() => {
        labelHideScheduleRef.current = null;
        hideDonorLabel(light.id);
      }, visibleMs);
    },
    [clearLabelExitTimeout, hideDonorLabel],
  );

  useEffect(
    () => () => {
      if (labelHideScheduleRef.current !== null) {
        window.clearTimeout(labelHideScheduleRef.current);
      }
      labelExitTimeoutRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      labelExitTimeoutRef.current.clear();
    },
    [],
  );

  const sphereView = useMemo(() => {
    const { width, height } = viewportSize;
    const shortest = Math.min(width, height);
    const isPhone = width <= 430;
    const isTablet = width <= 900;

    // Slightly zoom in compared to previous setup while adapting by screen size.
    const distance = isPhone ? 2.62 : isTablet ? 2.56 : 2.48;
    const fov = shortest < 430 ? 51 : isTablet ? 49 : 47;
    const dprMax = isPhone ? 1.2 : 1.5;
    // Keep the globe visually close to borders across device classes.
    const sphereScale = isPhone ? 1.42 : isTablet ? 1.34 : 1.26;
    return { distance, fov, dprMax, sphereScale };
  }, [viewportSize]);
  cameraDistanceRef.current = sphereView.distance;

  // Already-displayed rows (e.g. after refresh) appear instantly — no queue, labels, or motion.
  useEffect(() => {
    if (!feedHydrated) return;

    bumpReveal();

    if (!introDoneRef.current) {
      introDoneRef.current = true;
      if (!introNotifiedRef.current) {
        introNotifiedRef.current = true;
        onIntroCompleteRef.current?.();
      }
    }
  }, [donations, feedHydrated, bumpReveal]);

  useEffect(() => {
    if (!feedHydrated) return;

    let timeoutId = 0;
    let raf = 0;
    let cancelled = false;

    if (undisplayedDonationCount === 0) return;

    // Reload / reset: keep displayed lit instantly; only re-queue undisplayed rows.
    if (targetDonationLights < queuedDonationIdsRef.current.size) {
      queuedDonationIdsRef.current.clear();
      bumpReveal();
      return;
    }

    const playPulse = (onMeteorImpact?: () => void) =>
      new Promise<void>((resolve) => {
        if (cancelled) {
          resolve();
          return;
        }

        const waitUntilPulseVisible = () =>
          new Promise<void>((resume) => {
            if (!suppressPulseRef.current) {
              resume();
              return;
            }

            const check = () => {
              if (cancelled) {
                resume();
                return;
              }
              if (!suppressPulseRef.current) {
                resume();
                return;
              }
              raf = requestAnimationFrame(check);
            };
            raf = requestAnimationFrame(check);
          });

        void (async () => {
          await waitUntilPulseVisible();
          if (cancelled) {
            resolve();
            return;
          }
          const meteorStartedAt = performance.now();
          const meteorDurationMs = 980;

          const waveProgressWithEaseIn = (t: number): number => {
            if (t <= 0.42) {
              const u = t / 0.42;
              return 0.3 * Math.pow(u, 1.8);
            }
            if (t <= 0.72) {
              const u = (t - 0.42) / 0.3;
              return 0.3 + 0.52 * Math.pow(u, 0.72);
            }
            const u = (t - 0.72) / 0.28;
            return 0.82 + 0.18 * u;
          };

          const animatePulse = (pulseNow: number, pulseStartedAt: number) => {
            if (cancelled) {
              resolve();
              return;
            }
            const rawProgress = Math.min(1, (pulseNow - pulseStartedAt) / 1780);
            const progress = waveProgressWithEaseIn(rawProgress);
            setPulseProgress(progress);
            if (rawProgress >= 1) {
              setPulsePointIndex(null);
              resolve();
              return;
            }
            raf = requestAnimationFrame((now) => animatePulse(now, pulseStartedAt));
          };

          const animateMeteor = (now: number) => {
            if (cancelled) {
              resolve();
              return;
            }
            const raw = Math.min(1, (now - meteorStartedAt) / meteorDurationMs);
            setMeteorProgress(raw);
            if (raw >= 1) {
              onMeteorImpact?.();
              setMeteorPointIndex(null);
              setPulseProgress(0);
              const pulseStartedAt = performance.now();
              raf = requestAnimationFrame((pulseNow) => animatePulse(pulseNow, pulseStartedAt));
              return;
            }
            raf = requestAnimationFrame(animateMeteor);
          };

          setMeteorProgress(0);
          raf = requestAnimationFrame(animateMeteor);
        })();
      });

    const revealOnGlobe = (lightId: string) => {
      queuedDonationIdsRef.current.add(lightId);
      bumpReveal();
    };

    const startDelayMs = 280;
    timeoutId = window.setTimeout(() => {
      const runQueue = async () => {
        while (!cancelled) {
          const feed = donationsRef.current;
          const nextIndex = feed.findIndex(
            (donation) => !donation.displayed && !queuedDonationIdsRef.current.has(donation.id),
          );
          if (nextIndex === -1) break;

          const light = feed[nextIndex];
          if (!light || light.displayed) break;

          const pointIndex = light.pointIndex;
          const isMine = light.mine;
          const pending = feed.filter(
            (donation) => !donation.displayed && !queuedDonationIdsRef.current.has(donation.id),
          ).length;
          const globeVisible =
            typeof document === 'undefined' || document.visibilityState === 'visible';
          // Always animate my own donations. Others animate only while the globe
          // is visible and the backlog is small; otherwise we catch them up
          // silently in the background (they still appear, just without a meteor).
          const animateThis = isMine || (globeVisible && pending <= 6);

          if (!animateThis) {
            revealOnGlobe(light.id);
            void markDonationDisplayed(light.id);
            continue;
          }

          const upSign = nextIndex % 2 === 0 ? 1 : -1;
          const verticalMagnitude = 0.75 + seededRandom(pointIndex * 67 + 13) * 0.55;
          const sideMagnitude = (seededRandom(pointIndex * 89 + 29) - 0.5) * 1.35;
          setMeteorArcVerticalBias(upSign * verticalMagnitude);
          setMeteorArcSideBias(sideMagnitude);
          setMeteorLaunchInverseMatrix([...sphereTransformRef.current.inverseMatrix]);
          setMeteorIsMine(isMine);
          setMeteorPointIndex(pointIndex);
          const lightView = toDonationLightView(light);
          await playPulse(() => {
            revealOnGlobe(light.id);
            setPulsePointIndex(pointIndex);
            showDonorLabel(lightView);
          });
          void markDonationDisplayed(light.id);
          if (cancelled) return;
          await new Promise<void>((resolve) => {
            timeoutId = window.setTimeout(() => resolve(), 180);
          });
        }
        if (cancelled) return;
        if (!introNotifiedRef.current) {
          introNotifiedRef.current = true;
          onIntroCompleteRef.current?.();
        }
      };
      void runQueue();
    }, startDelayMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      cancelAnimationFrame(raf);
    };
  }, [targetDonationLights, feedHydrated, undisplayedDonationCount, bumpReveal]);

  return (
    <section className="donation-sphere-card" aria-live="polite">
      <div className="donation-sphere-canvas-wrap">
        <Canvas
          dpr={[1, sphereView.dprMax]}
          camera={{ position: [0, 0, sphereView.distance], fov: sphereView.fov }}
          raycaster={{
            params: {
              Mesh: {},
              Line: { threshold: 1 },
              LOD: {},
              Points: { threshold: 0.045 },
              Sprite: {},
            },
          }}
        >
          <ambientLight intensity={0.82} />
          <SpinningPointSphere
            data={pointData}
            revealOrder={revealOrder}
            defaultLitCount={baselineLitCount}
            visibleDonationLights={visibleDonationLights}
            donorLabelOverlays={donorLabelOverlays}
            paused={false}
            meteorPointIndex={meteorPointIndex}
            meteorProgress={meteorProgress}
            meteorIsMine={meteorIsMine}
            meteorLaunchInverseMatrix={meteorLaunchInverseMatrix}
            meteorArcVerticalBias={meteorArcVerticalBias}
            meteorArcSideBias={meteorArcSideBias}
            cameraDistance={sphereView.distance}
            pulsePointIndex={pulsePointIndex}
            pulseProgress={pulseProgress}
            sphereScale={sphereView.sphereScale}
            onTransformSample={(qx, qy, qz, qw, inverseMatrix) => {
              sphereTransformRef.current = {
                quaternion: { x: qx, y: qy, z: qz, w: qw },
                inverseMatrix,
              };
            }}
          />
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            enableRotate={false}
            autoRotate={false}
            minPolarAngle={Math.PI / 2 - 0.45}
            maxPolarAngle={Math.PI / 2 + 0.45}
            minDistance={sphereView.distance}
            maxDistance={sphereView.distance}
            rotateSpeed={0}
            dampingFactor={0}
            enableDamping={false}
            enabled
          />
        </Canvas>
      </div>
    </section>
  );
}
