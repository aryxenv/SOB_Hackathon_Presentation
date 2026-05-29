import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Html, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { CanvasTexture, Matrix4, Vector3 } from "three";
import type { Group } from "three";
import { cn } from "@/lib/utils";
import {
  DEFAULT_PRELIT_ATHLETES,
  getSphereLayout,
  type SphereLayout,
} from "../lib/sphereLayout";
import { useDonationFeed, useFeedHydrated, type FeedDonation } from "../lib/donationFeed";
import "./impact-sphere.css";

const GLOBE_RADIUS = 0.68;
const CAMERA_DISTANCE = 2.48;
const SPHERE_SCALE = 1.26;
const METEOR_DURATION_MS = 980;
const PULSE_DURATION_MS = 1780;
const ARRIVAL_GAP_MS = 180;
const DONOR_LABEL_MAX_VISIBLE_MS = 2000;
const DONOR_LABEL_EXIT_MS = 280;
/** Past this backlog (or when the tab is hidden) we reveal instantly to catch up. */
const ANIMATION_BACKLOG_LIMIT = 6;

interface DonorLabelOverlay {
  light: FeedDonation;
  leaving: boolean;
}

function seededRandom(seed: number): number {
  const value = Math.sin(seed * 913.13) * 10000;
  return value - Math.floor(value);
}

function buildPersonTexture(): CanvasTexture | null {
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#ffffff";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
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

function formatDonorDisplayName(alias: string | null): string {
  const trimmed = (alias ?? "").trim();
  if (!trimmed) return "Supporter";
  if (trimmed.length > 22) return `${trimmed.slice(0, 20)}…`;
  return trimmed;
}

function labelPosition(x: number, y: number, z: number): [number, number, number] {
  const length = Math.sqrt(x * x + y * y + z * z) || 1;
  const offset = 0.1;
  return [x + (x / length) * offset, y + (y / length) * offset, z + (z / length) * offset];
}

interface DonorGlobeLabelProps {
  coords: [number, number, number];
  isPulsing: boolean;
  light: FeedDonation;
  leaving: boolean;
}

function DonorGlobeLabel({ coords, isPulsing, light, leaving }: DonorGlobeLabelProps) {
  return (
    <Html
      center
      distanceFactor={4.2}
      occlude={false}
      position={labelPosition(coords[0], coords[1], coords[2])}
      zIndexRange={[40, 0]}
    >
      <div
        className={cn(
          "donor-globe-label",
          leaving ? "is-leaving" : "is-visible",
          light.mine ? "is-mine" : "is-other",
          isPulsing && "is-pulsing",
        )}
      >
        {formatDonorDisplayName(light.donorAlias)}
      </div>
    </Html>
  );
}

interface SpinningPointSphereProps {
  data: SphereLayout;
  defaultLitCount: number;
  donationPointIndices: number[];
  donorLabelOverlays: DonorLabelOverlay[];
  meteorArcSideBias: number;
  meteorArcVerticalBias: number;
  meteorLaunchInverseMatrix: number[];
  meteorPointIndex: number | null;
  meteorProgress: number;
  onTransformSample: (inverseMatrix: number[]) => void;
  pulsePointIndex: number | null;
  pulseProgress: number;
}

function SpinningPointSphere({
  data,
  defaultLitCount,
  donationPointIndices,
  donorLabelOverlays,
  meteorArcSideBias,
  meteorArcVerticalBias,
  meteorLaunchInverseMatrix,
  meteorPointIndex,
  meteorProgress,
  onTransformSample,
  pulsePointIndex,
  pulseProgress,
}: SpinningPointSphereProps) {
  const groupRef = useRef<Group>(null);
  const { positions, revealOrder } = data;
  const totalPoints = revealOrder.length;
  const pointSize = totalPoints >= 7000 ? 0.082 : 0.03;

  const {
    baseLitPositions,
    emptyPositions,
    glowPositions,
    meteorHeadScale,
    meteorPositions,
    pulseBoost,
    pulseHighlightPositions,
  } = useMemo(() => {
    const baseLitThreshold = Math.min(Math.max(defaultLitCount, 0), totalPoints);
    const isLitByPoint = new Uint8Array(totalPoints);

    for (let i = 0; i < baseLitThreshold; i++) {
      const pointIndex = revealOrder[i];
      isLitByPoint[pointIndex] = 1;
    }
    for (const pointIndex of donationPointIndices) {
      if (pointIndex >= 0 && pointIndex < totalPoints) isLitByPoint[pointIndex] = 1;
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

    const displacedPoint = (pointIndex: number): [number, number, number] => {
      const x = positions[pointIndex * 3];
      const y = positions[pointIndex * 3 + 1];
      const z = positions[pointIndex * 3 + 2];
      if (!hasWave) return [x, y, z];

      const r = Math.sqrt(x * x + y * y + z * z) || 1;
      const dot = (waveUnitX * x + waveUnitY * y + waveUnitZ * z) / r;
      const clamped = Math.max(-1, Math.min(1, dot));
      const angularDistance = Math.acos(clamped);
      const distanceToBand = angularDistance - waveAngle;
      const gaussianBand = Math.exp(-(distanceToBand * distanceToBand) / (2 * waveSigma * waveSigma));
      const globalDisplacement = waveAmplitude * 0.18 * waveEnvelope;
      const localDisplacement = waveAmplitude * waveEnvelope * gaussianBand;
      const scale = 1 + globalDisplacement + localDisplacement;
      return [x * scale, y * scale, z * scale];
    };

    const baseLitCoords: number[] = [];
    const emptyCoords: number[] = [];

    for (let i = 0; i < totalPoints; i++) {
      const [dx, dy, dz] = displacedPoint(i);
      if (isLitByPoint[i]) {
        baseLitCoords.push(dx, dy, dz);
      } else {
        emptyCoords.push(dx, dy, dz);
      }
    }

    const glowCoords: number[] = [];
    const recentDonations = donationPointIndices.slice(-120);
    for (const pointIndex of recentDonations) {
      if (pointIndex < 0 || pointIndex >= totalPoints) continue;
      const [dx, dy, dz] = displacedPoint(pointIndex);
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
      const launchInverse = new Matrix4().fromArray(meteorLaunchInverseMatrix);
      const worldStart = new Vector3(0, 0, CAMERA_DISTANCE - 0.32);
      const startLocal = worldStart.applyMatrix4(launchInverse);
      const worldUpSample = new Vector3(0, 1, CAMERA_DISTANCE - 0.32);
      const upLocalSample = worldUpSample.applyMatrix4(launchInverse);
      const sx = startLocal.x;
      const sy = startLocal.y;
      const sz = startLocal.z;
      const baseX = sx + (tx - sx) * easedT;
      const baseY = sy + (ty - sy) * easedT;
      const baseZ = sz + (tz - sz) * easedT;
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
      if (orthoUpLen < 0.0001) {
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

      const arcAmplitude = GLOBE_RADIUS * (0.13 + seededRandom(meteorPointIndex * 97 + 5) * 0.14);
      const arcWeight = Math.sin(Math.PI * easedT);
      const offsetX = (orthoUpX * meteorArcVerticalBias + rightX * meteorArcSideBias * 0.45) * arcAmplitude * arcWeight;
      const offsetY = (orthoUpY * meteorArcVerticalBias + rightY * meteorArcSideBias * 0.45) * arcAmplitude * arcWeight;
      const offsetZ = (orthoUpZ * meteorArcVerticalBias + rightZ * meteorArcSideBias * 0.45) * arcAmplitude * arcWeight;

      meteorCoords.push(baseX + offsetX, baseY + offsetY, baseZ + offsetZ);
      const perspectiveShrink = 1 - Math.pow(easedT, 0.72);
      meteorHeadScale = 1.35 + perspectiveShrink * 8.15;
    }

    return {
      baseLitPositions: new Float32Array(baseLitCoords),
      emptyPositions: new Float32Array(emptyCoords),
      glowPositions: new Float32Array(glowCoords),
      pulseHighlightPositions: new Float32Array(pulseCoords),
      pulseBoost: Math.sin(Math.max(0, Math.min(1, pulseProgress)) * Math.PI),
      meteorPositions: new Float32Array(meteorCoords),
      meteorHeadScale,
    };
  }, [
    defaultLitCount,
    donationPointIndices,
    meteorArcSideBias,
    meteorArcVerticalBias,
    meteorLaunchInverseMatrix,
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
    group.rotation.y += delta * 0.045;
    const wobble = Math.sin(state.clock.elapsedTime * 0.1) * 0.04;
    group.rotation.x += (wobble - group.rotation.x) * 0.06;
    group.updateMatrixWorld(true);
    onTransformSample([...group.matrixWorld.clone().invert().elements]);
  });

  return (
    <group ref={groupRef} scale={[SPHERE_SCALE, SPHERE_SCALE, SPHERE_SCALE]}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[emptyPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          alphaTest={0.08}
          color="#c8c8c8"
          depthWrite={false}
          map={personTexture ?? undefined}
          opacity={0.2}
          size={pointSize}
          toneMapped={false}
          transparent
        />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[baseLitPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          alphaTest={0.08}
          color="#ff2b4f"
          depthWrite
          map={personTexture ?? undefined}
          opacity={1}
          size={pointSize}
          toneMapped={false}
          transparent
        />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pulseHighlightPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          alphaTest={0.05}
          color="#ffe08a"
          depthWrite={false}
          map={personTexture ?? undefined}
          opacity={0.72 + pulseBoost * 0.26}
          size={pointSize * (1.5 + pulseBoost * 0.95)}
          toneMapped={false}
          transparent
        />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[meteorPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          alphaTest={0.05}
          color="#ff2b4f"
          depthWrite={false}
          map={personTexture ?? undefined}
          opacity={0.98}
          size={pointSize * meteorHeadScale}
          toneMapped={false}
          transparent
        />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[glowPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          alphaTest={0.05}
          color="#ffe08a"
          depthWrite={false}
          map={personTexture ?? undefined}
          opacity={0.5}
          size={pointSize * 1.22}
          toneMapped={false}
          transparent
        />
      </points>
      {donorLabelOverlays.map((overlay) => {
        const { pointIndex } = overlay.light;
        const coords: [number, number, number] = [
          positions[pointIndex * 3],
          positions[pointIndex * 3 + 1],
          positions[pointIndex * 3 + 2],
        ];
        return (
          <DonorGlobeLabel
            key={overlay.light.id}
            coords={coords}
            isPulsing={pulsePointIndex === pointIndex}
            leaving={overlay.leaving}
            light={overlay.light}
          />
        );
      })}
    </group>
  );
}

const IDENTITY_MATRIX = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

function pulseEasing(rawProgress: number): number {
  if (rawProgress <= 0.42) return 0.3 * Math.pow(rawProgress / 0.42, 1.8);
  if (rawProgress <= 0.72) return 0.3 + 0.52 * Math.pow((rawProgress - 0.42) / 0.3, 0.72);
  return 0.82 + 0.18 * ((rawProgress - 0.72) / 0.28);
}

export function ImpactSphere() {
  const layout = useMemo(() => getSphereLayout(), []);
  const feed = useDonationFeed();
  const hydrated = useFeedHydrated();

  const [visibleDonations, setVisibleDonations] = useState<FeedDonation[]>([]);
  const [donorLabelOverlays, setDonorLabelOverlays] = useState<DonorLabelOverlay[]>([]);
  const [meteorArcSideBias, setMeteorArcSideBias] = useState(0);
  const [meteorArcVerticalBias, setMeteorArcVerticalBias] = useState(0.9);
  const [meteorLaunchInverseMatrix, setMeteorLaunchInverseMatrix] = useState<number[]>(IDENTITY_MATRIX);
  const [meteorPointIndex, setMeteorPointIndex] = useState<number | null>(null);
  const [meteorProgress, setMeteorProgress] = useState(1);
  const [pulsePointIndex, setPulsePointIndex] = useState<number | null>(null);
  const [pulseProgress, setPulseProgress] = useState(1);

  const mountedRef = useRef(true);
  const inverseMatrixRef = useRef<number[]>(IDENTITY_MATRIX);
  const processedIdsRef = useRef<Set<string>>(new Set());
  const queueRef = useRef<FeedDonation[]>([]);
  const runningRef = useRef(false);
  const didInitRef = useRef(false);
  const rafRef = useRef(0);
  const gapTimeoutRef = useRef(0);
  const labelHideTimerRef = useRef(0);
  const labelExitTimerRef = useRef(0);

  const donationPointIndices = useMemo(
    () => visibleDonations.map((donation) => donation.pointIndex),
    [visibleDonations],
  );

  const revealDonation = useCallback((donation: FeedDonation) => {
    setVisibleDonations((previous) =>
      previous.some((entry) => entry.id === donation.id) ? previous : [...previous, donation],
    );
  }, []);

  const showDonorLabel = useCallback((donation: FeedDonation) => {
    window.clearTimeout(labelHideTimerRef.current);
    window.clearTimeout(labelExitTimerRef.current);
    setDonorLabelOverlays([{ light: donation, leaving: false }]);
    labelHideTimerRef.current = window.setTimeout(() => {
      setDonorLabelOverlays((previous) =>
        previous.map((overlay) =>
          overlay.light.id === donation.id ? { ...overlay, leaving: true } : overlay,
        ),
      );
      labelExitTimerRef.current = window.setTimeout(() => {
        setDonorLabelOverlays((previous) =>
          previous.filter((overlay) => overlay.light.id !== donation.id),
        );
      }, DONOR_LABEL_EXIT_MS);
    }, DONOR_LABEL_MAX_VISIBLE_MS);
  }, []);

  const animateArrival = useCallback(
    (donation: FeedDonation) =>
      new Promise<void>((resolve) => {
        const { pointIndex } = donation;
        const upSign = pointIndex % 2 === 0 ? 1 : -1;
        setMeteorArcVerticalBias(upSign * (0.75 + seededRandom(pointIndex * 67 + 13) * 0.55));
        setMeteorArcSideBias((seededRandom(pointIndex * 89 + 29) - 0.5) * 1.35);
        setMeteorLaunchInverseMatrix([...inverseMatrixRef.current]);
        setMeteorPointIndex(pointIndex);
        setMeteorProgress(0);

        const meteorStartedAt = performance.now();

        const animatePulse = (now: number, pulseStartedAt: number) => {
          if (!mountedRef.current) {
            resolve();
            return;
          }
          const rawProgress = Math.min(1, (now - pulseStartedAt) / PULSE_DURATION_MS);
          setPulseProgress(pulseEasing(rawProgress));
          if (rawProgress >= 1) {
            setPulsePointIndex(null);
            resolve();
            return;
          }
          rafRef.current = requestAnimationFrame((next) => animatePulse(next, pulseStartedAt));
        };

        const animateMeteor = (now: number) => {
          if (!mountedRef.current) {
            resolve();
            return;
          }
          const raw = Math.min(1, (now - meteorStartedAt) / METEOR_DURATION_MS);
          setMeteorProgress(raw);
          if (raw >= 1) {
            setMeteorPointIndex(null);
            revealDonation(donation);
            showDonorLabel(donation);
            setPulsePointIndex(pointIndex);
            setPulseProgress(0);
            const pulseStartedAt = performance.now();
            rafRef.current = requestAnimationFrame((next) => animatePulse(next, pulseStartedAt));
            return;
          }
          rafRef.current = requestAnimationFrame(animateMeteor);
        };

        rafRef.current = requestAnimationFrame(animateMeteor);
      }),
    [revealDonation, showDonorLabel],
  );

  const pump = useCallback(() => {
    if (runningRef.current) return;
    const next = queueRef.current.shift();
    if (!next) return;
    runningRef.current = true;

    const backlog = queueRef.current.length;
    if (document.hidden || backlog > ANIMATION_BACKLOG_LIMIT) {
      // Catch up silently when many donations arrive at once or the tab is hidden.
      revealDonation(next);
      runningRef.current = false;
      pump();
      return;
    }

    void animateArrival(next).then(() => {
      runningRef.current = false;
      gapTimeoutRef.current = window.setTimeout(() => pump(), ARRIVAL_GAP_MS);
    });
  }, [animateArrival, revealDonation]);

  useEffect(() => {
    if (!hydrated) return;

    if (!didInitRef.current) {
      didInitRef.current = true;
      for (const donation of feed) processedIdsRef.current.add(donation.id);
      setVisibleDonations(feed.slice());
      return;
    }

    const arrivals = feed.filter((donation) => !processedIdsRef.current.has(donation.id));
    if (arrivals.length === 0) return;
    for (const donation of arrivals) {
      processedIdsRef.current.add(donation.id);
      queueRef.current.push(donation);
    }
    pump();
  }, [feed, hydrated, pump]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(rafRef.current);
      window.clearTimeout(gapTimeoutRef.current);
      window.clearTimeout(labelHideTimerRef.current);
      window.clearTimeout(labelExitTimerRef.current);
    };
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, CAMERA_DISTANCE], fov: 47 }}
      dpr={[1, 1.5]}
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
        data={layout}
        defaultLitCount={DEFAULT_PRELIT_ATHLETES}
        donationPointIndices={donationPointIndices}
        donorLabelOverlays={donorLabelOverlays}
        meteorArcSideBias={meteorArcSideBias}
        meteorArcVerticalBias={meteorArcVerticalBias}
        meteorLaunchInverseMatrix={meteorLaunchInverseMatrix}
        meteorPointIndex={meteorPointIndex}
        meteorProgress={meteorProgress}
        onTransformSample={(inverseMatrix) => {
          inverseMatrixRef.current = inverseMatrix;
        }}
        pulsePointIndex={pulsePointIndex}
        pulseProgress={pulseProgress}
      />
      <OrbitControls
        autoRotate={false}
        dampingFactor={0}
        enableDamping={false}
        enablePan={false}
        enableRotate={false}
        enableZoom={false}
        maxDistance={CAMERA_DISTANCE}
        maxPolarAngle={Math.PI / 2 + 0.45}
        minDistance={CAMERA_DISTANCE}
        minPolarAngle={Math.PI / 2 - 0.45}
        rotateSpeed={0}
      />
    </Canvas>
  );
}
