export { DonationSphere, EURO_PER_LIT_ATHLETE, GLOBE_RADIUS, PERSON_POINT_COUNT } from './DonationSphereClean';
/*
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { CanvasTexture } from 'three';
import type { Group } from 'three';
import { useDonationStats } from '../hooks/useDonationStats';
import { useData } from '../hooks/useData';
import { useI18n } from '../i18n/I18nContext';
import './DonationSphere.css';

export const PERSON_POINT_COUNT = 7000;
export const GLOBE_RADIUS = 0.68;
export const PEOPLE_LIT_PER_DONATION = 6;

interface PointData {
  positions: Float32Array;
  revealOrder: number[];
}

function shuffleBySeed(indices: number[]): number[] {
  const copy = [...indices];
  for (let i = copy.length - 1; i > 0; i--) {
    const seed = Math.sin((i + 1) * 913.13) * 10000;
    const j = Math.floor((seed - Math.floor(seed)) * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function createPointData(totalPoints: number): PointData {
  const positions = new Float32Array(totalPoints * 3);
  let seed = 1337;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const side = Math.ceil(Math.sqrt(totalPoints));
  const cells = side * side;
  for (let i = 0; i < totalPoints; i++) {
    const cellIndex = Math.floor((i * cells) / totalPoints);
    const row = Math.floor(cellIndex / side);
    const col = cellIndex % side;
    const u = (col + 0.5) / side;
    const v = (row + 0.5) / side;
    const lon = u * Math.PI * 2;
    const lat = (v - 0.5) * Math.PI;
    const cosLat = Math.cos(lat);
    const jitter = (random() - 0.5) * 0.004;
    const r = GLOBE_RADIUS + jitter;

    positions[i * 3] = Math.sin(lon) * cosLat * r;
    positions[i * 3 + 1] = Math.sin(lat) * r;
    positions[i * 3 + 2] = Math.cos(lon) * cosLat * r;
  }

  const revealOrder = shuffleBySeed(Array.from({ length: totalPoints }, (_, i) => i));
  return { positions, revealOrder };
}

function buildPersonTexture(): CanvasTexture | null {
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
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
  litCount: number;
  paused: boolean;
  onSelectLitPoint: (pointIndex: number) => void;
}

function SpinningPointSphere({ data, litCount, paused, onSelectLitPoint }: SpinningPointSphereProps) {
  const groupRef = useRef<Group>(null);
  const { positions, revealOrder } = data;
  const totalPoints = revealOrder.length;
  const pointSize = totalPoints >= 7000 ? 0.082 : 0.03;

  const { litPositions, emptyPositions, litPointIndices, glowPositions } = useMemo(() => {
    const litThreshold = Math.min(Math.max(litCount, 0), totalPoints);
    const isLitByPoint = new Uint8Array(totalPoints);
    for (let i = 0; i < litThreshold; i++) {
      isLitByPoint[revealOrder[i]] = 1;
    }

    const litCoords: number[] = [];
    const litIndices: number[] = [];
    const emptyCoords: number[] = [];
    for (let i = 0; i < totalPoints; i++) {
      if (isLitByPoint[i]) {
        litCoords.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
        litIndices.push(i);
      } else {
        emptyCoords.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      }
    }

    const glowCoords: number[] = [];
    const glowStart = Math.max(0, litThreshold - 120);
    for (let i = glowStart; i < litThreshold; i++) {
      const pointIndex = revealOrder[i];
      glowCoords.push(positions[pointIndex * 3], positions[pointIndex * 3 + 1], positions[pointIndex * 3 + 2]);
    }

    return {
      litPositions: new Float32Array(litCoords),
      litPointIndices: new Int32Array(litIndices),
      emptyPositions: new Float32Array(emptyCoords),
      glowPositions: new Float32Array(glowCoords),
    };
  }, [litCount, positions, revealOrder, totalPoints]);

  const personTexture = useMemo(() => buildPersonTexture(), []);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    if (!paused) {
      group.rotation.y += delta * 0.042;
    }
    const wobble = Math.sin(state.clock.elapsedTime * 0.14) * 0.06;
    group.rotation.x += (wobble - group.rotation.x) * 0.06;

    const litRatio = Math.min(1, litCount / PERSON_POINT_COUNT);
    const targetScale = 1 + litRatio * 0.1 + Math.sin(state.clock.elapsedTime * 0.45) * 0.02;
    group.scale.x += (targetScale - group.scale.x) * 0.06;
    group.scale.y += (targetScale - group.scale.y) * 0.06;
    group.scale.z += (targetScale - group.scale.z) * 0.06;
  });

  return (
    <group ref={groupRef}>
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
      <points
        onPointerDown={(event) => {
          event.stopPropagation();
          if (typeof event.index !== 'number') return;
          const pointIndex = litPointIndices[event.index];
          if (typeof pointIndex !== 'number') return;
          onSelectLitPoint(pointIndex);
        }}
      >
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[litPositions, 3]} />
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
          <bufferAttribute attach="attributes-position" args={[glowPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={pointSize * 1.22}
          color="#ff8aa0"
          transparent
          opacity={0.35}
          depthWrite={false}
          map={personTexture ?? undefined}
          alphaTest={0.05}
          toneMapped={false}
        />
      </points>
    </group>
  );
}

interface DonationSphereProps {
  onIntroComplete?: () => void;
}

export function DonationSphere({ onIntroComplete }: DonationSphereProps) {
  const { t } = useI18n();
  const { players } = useData();
  const { donationCount } = useDonationStats();
  const totalPoints = PERSON_POINT_COUNT;
  const pointData = useMemo(() => createPointData(totalPoints), [totalPoints]);
  const targetLitPoints = Math.min(donationCount * PEOPLE_LIT_PER_DONATION, totalPoints);
  const [animatedLitPoints, setAnimatedLitPoints] = useState(0);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const animatedLitRef = useRef(0);
  const introDoneRef = useRef(false);
  const introNotifiedRef = useRef(false);

  const litPointSet = useMemo(() => new Set(pointData.revealOrder.slice(0, Math.max(0, animatedLitPoints))), [animatedLitPoints, pointData.revealOrder]);

  useEffect(() => {
    const start = animatedLitRef.current;
    const end = targetLitPoints;
    if (start === end) return;

    const stepIntervalMs = introDoneRef.current ? 28 : 48;
    let accumulator = 0;
    let lastAt = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const delta = now - lastAt;
      lastAt = now;
      accumulator += delta;

      let next = animatedLitRef.current;
      while (accumulator >= stepIntervalMs && next !== end) {
        next += end > next ? 1 : -1;
        accumulator -= stepIntervalMs;
      }

      animatedLitRef.current = next;
      setAnimatedLitPoints(next);

      if (next !== end) {
        raf = requestAnimationFrame(tick);
        return;
      }

      introDoneRef.current = true;
      if (!introNotifiedRef.current) {
        introNotifiedRef.current = true;
        onIntroComplete?.();
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onIntroComplete, targetLitPoints]);

  const selectedAthlete = selectedPoint !== null && players.length > 0 ? players[selectedPoint % players.length] : null;

  return (
    <section className="donation-sphere-card" aria-live="polite">
      <div className="donation-sphere-canvas-wrap">
        <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 2.05], fov: 42 }} onPointerMissed={() => setSelectedPoint(null)}>
          <ambientLight intensity={0.82} />
          <SpinningPointSphere
            data={pointData}
            litCount={animatedLitPoints}
            paused={selectedPoint !== null}
            onSelectLitPoint={(pointIndex) => {
              if (litPointSet.has(pointIndex)) {
                setSelectedPoint(pointIndex);
              }
            }}
          />
          <OrbitControls
            enablePan={false}
            enableZoom
            autoRotate
            autoRotateSpeed={0.45}
            minPolarAngle={Math.PI / 2 - 0.45}
            maxPolarAngle={Math.PI / 2 + 0.45}
            minDistance={1.65}
            maxDistance={2.5}
            rotateSpeed={0.65}
            dampingFactor={0.08}
            enableDamping
            enabled={selectedPoint === null}
          />
        </Canvas>
      </div>
      <p className="donation-sphere-progress">{t('shop.sphereProgress', { count: animatedLitPoints, total: totalPoints })}</p>
      {selectedAthlete && (
        <div className="sphere-picked-athlete">
          <p className="sphere-picked-label">{t('shop.sphereSelected')}</p>
          <p className="sphere-picked-name">{selectedAthlete.name}</p>
          <p className="sphere-picked-team">{selectedAthlete.team}</p>
        </div>
      )}
    </section>
  );
}
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { CanvasTexture } from 'three';
import type { Group } from 'three';
import { useDonationStats } from '../hooks/useDonationStats';
import { useData } from '../hooks/useData';
import { useI18n } from '../i18n/I18nContext';
import './DonationSphere.css';

export const PERSON_POINT_COUNT = 7000;
export const GLOBE_RADIUS = 0.68;
export const PEOPLE_LIT_PER_DONATION = 6;

interface PointData {
  positions: Float32Array;
  revealOrder: number[];
}

function shuffleBySeed(indices: number[]): number[] {
  const copy = [...indices];
  for (let i = copy.length - 1; i > 0; i--) {
    const seed = Math.sin((i + 1) * 913.13) * 10000;
    const j = Math.floor((seed - Math.floor(seed)) * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function createPointData(totalPoints: number): PointData {
  const positions = new Float32Array(totalPoints * 3);
  let seed = 1337;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const side = Math.ceil(Math.sqrt(totalPoints));
  const cells = side * side;
  for (let i = 0; i < totalPoints; i++) {
    const cellIndex = Math.floor((i * cells) / totalPoints);
    const row = Math.floor(cellIndex / side);
    const col = cellIndex % side;
    const u = (col + 0.5) / side;
    const v = (row + 0.5) / side;
    const lon = u * Math.PI * 2;
    const lat = (v - 0.5) * Math.PI;
    const cosLat = Math.cos(lat);
    const jitter = (random() - 0.5) * 0.004;
    const r = GLOBE_RADIUS + jitter;

    positions[i * 3] = Math.sin(lon) * cosLat * r;
    positions[i * 3 + 1] = Math.sin(lat) * r;
    positions[i * 3 + 2] = Math.cos(lon) * cosLat * r;
  }

  const revealOrder = shuffleBySeed(Array.from({ length: totalPoints }, (_, i) => i));
  return { positions, revealOrder };
}

function buildPersonTexture(): CanvasTexture | null {
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
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
  litCount: number;
  paused: boolean;
  onSelectLitPoint: (pointIndex: number) => void;
}

function SpinningPointSphere({ data, litCount, paused, onSelectLitPoint }: SpinningPointSphereProps) {
  const groupRef = useRef<Group>(null);
  const { positions, revealOrder } = data;
  const totalPoints = revealOrder.length;
  const pointSize = totalPoints >= 7000 ? 0.082 : 0.03;

  const { litPositions, emptyPositions, litPointIndices, glowPositions } = useMemo(() => {
    const litThreshold = Math.min(Math.max(litCount, 0), totalPoints);
    const isLitByPoint = new Uint8Array(totalPoints);
    for (let i = 0; i < litThreshold; i++) {
      isLitByPoint[revealOrder[i]] = 1;
    }

    const litCoords: number[] = [];
    const litIndices: number[] = [];
    const emptyCoords: number[] = [];
    for (let i = 0; i < totalPoints; i++) {
      if (isLitByPoint[i]) {
        litCoords.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
        litIndices.push(i);
      } else {
        emptyCoords.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      }
    }

    const glowCoords: number[] = [];
    const glowStart = Math.max(0, litThreshold - 120);
    for (let i = glowStart; i < litThreshold; i++) {
      const pointIndex = revealOrder[i];
      glowCoords.push(positions[pointIndex * 3], positions[pointIndex * 3 + 1], positions[pointIndex * 3 + 2]);
    }

    return {
      litPositions: new Float32Array(litCoords),
      litPointIndices: new Int32Array(litIndices),
      emptyPositions: new Float32Array(emptyCoords),
      glowPositions: new Float32Array(glowCoords),
    };
  }, [litCount, positions, revealOrder, totalPoints]);

  const personTexture = useMemo(() => buildPersonTexture(), []);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    if (!paused) {
      group.rotation.y += delta * 0.042;
    }
    const wobble = Math.sin(state.clock.elapsedTime * 0.14) * 0.06;
    group.rotation.x += (wobble - group.rotation.x) * 0.06;

    const litRatio = Math.min(1, litCount / PERSON_POINT_COUNT);
    const targetScale = 1 + litRatio * 0.1 + Math.sin(state.clock.elapsedTime * 0.45) * 0.02;
    group.scale.x += (targetScale - group.scale.x) * 0.06;
    group.scale.y += (targetScale - group.scale.y) * 0.06;
    group.scale.z += (targetScale - group.scale.z) * 0.06;
  });

  return (
    <group ref={groupRef}>
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

      <points
        onPointerDown={(event) => {
          event.stopPropagation();
          if (typeof event.index !== 'number') return;
          const pointIndex = litPointIndices[event.index];
          if (typeof pointIndex !== 'number') return;
          onSelectLitPoint(pointIndex);
        }}
      >
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[litPositions, 3]} />
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
          <bufferAttribute attach="attributes-position" args={[glowPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={pointSize * 1.22}
          color="#ff8aa0"
          transparent
          opacity={0.35}
          depthWrite={false}
          map={personTexture ?? undefined}
          alphaTest={0.05}
          toneMapped={false}
        />
      </points>
    </group>
  );
}

interface DonationSphereProps {
  onIntroComplete?: () => void;
}

export function DonationSphere({ onIntroComplete }: DonationSphereProps) {
  const { t } = useI18n();
  const { players } = useData();
  const { donationCount } = useDonationStats();
  const totalPoints = PERSON_POINT_COUNT;
  const pointData = useMemo(() => createPointData(totalPoints), [totalPoints]);
  const targetLitPoints = Math.min(donationCount * PEOPLE_LIT_PER_DONATION, totalPoints);
  const [animatedLitPoints, setAnimatedLitPoints] = useState(0);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const animatedLitRef = useRef(0);
  const introDoneRef = useRef(false);
  const introNotifiedRef = useRef(false);

  const litPointSet = useMemo(() => {
    return new Set(pointData.revealOrder.slice(0, Math.max(0, animatedLitPoints)));
  }, [animatedLitPoints, pointData.revealOrder]);

  useEffect(() => {
    const start = animatedLitRef.current;
    const end = targetLitPoints;
    if (start === end) return;

    const stepIntervalMs = introDoneRef.current ? 28 : 48;
    let accumulator = 0;
    let lastAt = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const delta = now - lastAt;
      lastAt = now;
      accumulator += delta;

      let next = animatedLitRef.current;
      while (accumulator >= stepIntervalMs && next !== end) {
        next += end > next ? 1 : -1;
        accumulator -= stepIntervalMs;
      }

      animatedLitRef.current = next;
      setAnimatedLitPoints(next);

      if (next !== end) {
        raf = requestAnimationFrame(tick);
        return;
      }

      introDoneRef.current = true;
      if (!introNotifiedRef.current) {
        introNotifiedRef.current = true;
        onIntroComplete?.();
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onIntroComplete, targetLitPoints]);

  const selectedAthlete = selectedPoint !== null && players.length > 0 ? players[selectedPoint % players.length] : null;

  return (
    <section className="donation-sphere-card" aria-live="polite">
      <div className="donation-sphere-canvas-wrap">
        <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 2.05], fov: 42 }} onPointerMissed={() => setSelectedPoint(null)}>
          <ambientLight intensity={0.82} />
          <SpinningPointSphere
            data={pointData}
            litCount={animatedLitPoints}
            paused={selectedPoint !== null}
            onSelectLitPoint={(pointIndex) => {
              if (!litPointSet.has(pointIndex)) return;
              setSelectedPoint(pointIndex);
            }}
          />
          <OrbitControls
            enablePan={false}
            enableZoom
            autoRotate
            autoRotateSpeed={0.45}
            minPolarAngle={Math.PI / 2 - 0.45}
            maxPolarAngle={Math.PI / 2 + 0.45}
            minDistance={1.65}
            maxDistance={2.5}
            rotateSpeed={0.65}
            dampingFactor={0.08}
            enableDamping
            enabled={selectedPoint === null}
          />
        </Canvas>
      </div>
      <p className="donation-sphere-progress">{t('shop.sphereProgress', { count: animatedLitPoints, total: totalPoints })}</p>
      {selectedAthlete && (
        <div className="sphere-picked-athlete">
          <p className="sphere-picked-label">{t('shop.sphereSelected')}</p>
          <p className="sphere-picked-name">{selectedAthlete.name}</p>
          <p className="sphere-picked-team">{selectedAthlete.team}</p>
        </div>
      )}
    </section>
  );
}
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { CanvasTexture } from 'three';
import type { Group } from 'three';
import { useDonationStats } from '../hooks/useDonationStats';
import { useData } from '../hooks/useData';
import { useI18n } from '../i18n/I18nContext';
import './DonationSphere.css';

export const PERSON_POINT_COUNT = 7000;
export const GLOBE_RADIUS = 0.68;
export const PEOPLE_LIT_PER_DONATION = 6;

interface PointData {
  positions: Float32Array;
  revealOrder: number[];
}

function shuffleBySeed(indices: number[]): number[] {
  const copy = [...indices];
  for (let i = copy.length - 1; i > 0; i--) {
    const seed = Math.sin((i + 1) * 913.13) * 10000;
    const j = Math.floor((seed - Math.floor(seed)) * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function createPointData(totalPoints: number): PointData {
  const positions = new Float32Array(totalPoints * 3);
  let seed = 1337;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const side = Math.ceil(Math.sqrt(totalPoints));
  const cells = side * side;
  for (let i = 0; i < totalPoints; i++) {
    const cellIndex = Math.floor((i * cells) / totalPoints);
    const row = Math.floor(cellIndex / side);
    const col = cellIndex % side;

    const u = (col + 0.5) / side;
    const v = (row + 0.5) / side;
    const lon = u * Math.PI * 2;
    const lat = (v - 0.5) * Math.PI;
    const cosLat = Math.cos(lat);
    const jitter = (random() - 0.5) * 0.004;
    const r = GLOBE_RADIUS + jitter;

    positions[i * 3] = Math.sin(lon) * cosLat * r;
    positions[i * 3 + 1] = Math.sin(lat) * r;
    positions[i * 3 + 2] = Math.cos(lon) * cosLat * r;
  }

  const revealOrder = shuffleBySeed(Array.from({ length: totalPoints }, (_, i) => i));
  return { positions, revealOrder };
}

function buildPersonTexture(): CanvasTexture | null {
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
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
  litCount: number;
  paused: boolean;
  onSelectLitPoint: (pointIndex: number) => void;
}

function SpinningPointSphere({ data, litCount, paused, onSelectLitPoint }: SpinningPointSphereProps) {
  const groupRef = useRef<Group>(null);
  const { positions, revealOrder } = data;
  const totalPoints = revealOrder.length;
  const pointSize = totalPoints >= 7000 ? 0.082 : 0.03;

  const { litPositions, emptyPositions, litPointIndices, glowPositions } = useMemo(() => {
    const litThreshold = Math.min(Math.max(litCount, 0), totalPoints);
    const isLitByPoint = new Uint8Array(totalPoints);
    for (let i = 0; i < litThreshold; i++) {
      isLitByPoint[revealOrder[i]] = 1;
    }

    const litCoords: number[] = [];
    const litIndices: number[] = [];
    const emptyCoords: number[] = [];
    for (let i = 0; i < totalPoints; i++) {
      if (isLitByPoint[i]) {
        litCoords.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
        litIndices.push(i);
      } else {
        emptyCoords.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      }
    }

    const glowCoords: number[] = [];
    const glowStart = Math.max(0, litThreshold - 120);
    for (let i = glowStart; i < litThreshold; i++) {
      const pointIndex = revealOrder[i];
      glowCoords.push(positions[pointIndex * 3], positions[pointIndex * 3 + 1], positions[pointIndex * 3 + 2]);
    }

    return {
      litPositions: new Float32Array(litCoords),
      litPointIndices: new Int32Array(litIndices),
      emptyPositions: new Float32Array(emptyCoords),
      glowPositions: new Float32Array(glowCoords),
    };
  }, [litCount, positions, revealOrder, totalPoints]);

  const personTexture = useMemo(() => buildPersonTexture(), []);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    if (!paused) {
      group.rotation.y += delta * 0.042;
    }
    const wobble = Math.sin(state.clock.elapsedTime * 0.14) * 0.06;
    group.rotation.x += (wobble - group.rotation.x) * 0.06;

    const litRatio = Math.min(1, litCount / PERSON_POINT_COUNT);
    const targetScale = 1 + litRatio * 0.1 + Math.sin(state.clock.elapsedTime * 0.45) * 0.02;
    group.scale.x += (targetScale - group.scale.x) * 0.06;
    group.scale.y += (targetScale - group.scale.y) * 0.06;
    group.scale.z += (targetScale - group.scale.z) * 0.06;
  });

  return (
    <group ref={groupRef}>
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

      <points
        onPointerDown={(event) => {
          event.stopPropagation();
          if (typeof event.index !== 'number') return;
          const pointIndex = litPointIndices[event.index];
          if (typeof pointIndex !== 'number') return;
          onSelectLitPoint(pointIndex);
        }}
      >
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[litPositions, 3]} />
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
          <bufferAttribute attach="attributes-position" args={[glowPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={pointSize * 1.22}
          color="#ff8aa0"
          transparent
          opacity={0.35}
          depthWrite={false}
          map={personTexture ?? undefined}
          alphaTest={0.05}
          toneMapped={false}
        />
      </points>
    </group>
  );
}

interface DonationSphereProps {
  onIntroComplete?: () => void;
}

export function DonationSphere({ onIntroComplete }: DonationSphereProps) {
  const { t } = useI18n();
  const { players } = useData();
  const { donationCount } = useDonationStats();
  const totalPoints = PERSON_POINT_COUNT;
  const pointData = useMemo(() => createPointData(totalPoints), [totalPoints]);
  const targetLitPoints = Math.min(donationCount * PEOPLE_LIT_PER_DONATION, totalPoints);
  const [animatedLitPoints, setAnimatedLitPoints] = useState(0);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const animatedLitRef = useRef(0);
  const introDoneRef = useRef(false);
  const introNotifiedRef = useRef(false);

  const litPointSet = useMemo(() => {
    return new Set(pointData.revealOrder.slice(0, Math.max(0, animatedLitPoints)));
  }, [animatedLitPoints, pointData.revealOrder]);

  useEffect(() => {
    const start = animatedLitRef.current;
    const end = targetLitPoints;
    if (start === end) return;

    const stepIntervalMs = introDoneRef.current ? 28 : 48;
    let accumulator = 0;
    let lastAt = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const delta = now - lastAt;
      lastAt = now;
      accumulator += delta;

      let next = animatedLitRef.current;
      while (accumulator >= stepIntervalMs && next !== end) {
        next += end > next ? 1 : -1;
        accumulator -= stepIntervalMs;
      }

      animatedLitRef.current = next;
      setAnimatedLitPoints(next);

      if (next !== end) {
        raf = requestAnimationFrame(tick);
        return;
      }

      introDoneRef.current = true;
      if (!introNotifiedRef.current) {
        introNotifiedRef.current = true;
        onIntroComplete?.();
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onIntroComplete, targetLitPoints]);

  const selectedAthlete = selectedPoint !== null && players.length > 0 ? players[selectedPoint % players.length] : null;

  return (
    <section className="donation-sphere-card" aria-live="polite">
      <div className="donation-sphere-canvas-wrap">
        <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 2.05], fov: 42 }} onPointerMissed={() => setSelectedPoint(null)}>
          <ambientLight intensity={0.82} />
          <SpinningPointSphere
            data={pointData}
            litCount={animatedLitPoints}
            paused={selectedPoint !== null}
            onSelectLitPoint={(pointIndex) => {
              if (!litPointSet.has(pointIndex)) return;
              setSelectedPoint(pointIndex);
            }}
          />
          <OrbitControls
            enablePan={false}
            enableZoom
            autoRotate
            autoRotateSpeed={0.45}
            minPolarAngle={Math.PI / 2 - 0.45}
            maxPolarAngle={Math.PI / 2 + 0.45}
            minDistance={1.65}
            maxDistance={2.5}
            rotateSpeed={0.65}
            dampingFactor={0.08}
            enableDamping
            enabled={selectedPoint === null}
          />
        </Canvas>
      </div>
      <p className="donation-sphere-progress">{t('shop.sphereProgress', { count: animatedLitPoints, total: totalPoints })}</p>
      {selectedAthlete && (
        <div className="sphere-picked-athlete">
          <p className="sphere-picked-label">{t('shop.sphereSelected')}</p>
          <p className="sphere-picked-name">{selectedAthlete.name}</p>
          <p className="sphere-picked-team">{selectedAthlete.team}</p>
        </div>
      )}
    </section>
  );
}
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { CanvasTexture } from 'three';
import type { Group } from 'three';
import { useDonationStats } from '../hooks/useDonationStats';
import { useI18n } from '../i18n/I18nContext';
import './DonationSphere.css';

export const PERSON_POINT_COUNT = 7000;
const GLOBE_RADIUS = 0.68;
export const PEOPLE_LIT_PER_DONATION = 6;

interface PointData {
  positions: Float32Array;
  revealOrder: number[];
}

function shuffleBySeed(indices: number[]): number[] {
  const copy = [...indices];
  for (let i = copy.length - 1; i > 0; i--) {
    const seed = Math.sin((i + 1) * 913.13) * 10000;
    const j = Math.floor((seed - Math.floor(seed)) * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function createPointData(totalPoints: number): PointData {
  const positions = new Float32Array(totalPoints * 3);
  let seed = 1337;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const side = Math.ceil(Math.sqrt(totalPoints));
  const cells = side * side;
  for (let i = 0; i < totalPoints; i++) {
    const cellIndex = Math.floor((i * cells) / totalPoints);
    const row = Math.floor(cellIndex / side);
    const col = cellIndex % side;

    const u = (col + 0.5) / side;
    const v = (row + 0.5) / side;
    const lon = u * Math.PI * 2;
    const lat = (v - 0.5) * Math.PI;
    const cosLat = Math.cos(lat);

    const jitter = (random() - 0.5) * 0.004;
    const r = GLOBE_RADIUS + jitter;

    positions[i * 3] = Math.sin(lon) * cosLat * r;
    positions[i * 3 + 1] = Math.sin(lat) * r;
    positions[i * 3 + 2] = Math.cos(lon) * cosLat * r;
  }

  const revealOrder = shuffleBySeed(Array.from({ length: totalPoints }, (_, i) => i));
  return { positions, revealOrder };
}

function buildPersonTexture(): CanvasTexture | null {
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
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
  litCount: number;
}

function SpinningPointSphere({ data, litCount }: SpinningPointSphereProps) {
  const groupRef = useRef<Group>(null);
  const { positions, revealOrder } = data;
  const totalPoints = revealOrder.length;
  const pointSize = totalPoints >= 7000 ? 0.082 : 0.03;

  const { litPositions, emptyPositions } = useMemo(() => {
    const litThreshold = Math.min(Math.max(litCount, 0), totalPoints);
    const isLitByPoint = new Uint8Array(totalPoints);
    for (let i = 0; i < litThreshold; i++) {
      isLitByPoint[revealOrder[i]] = 1;
    }

    const litCoords: number[] = [];
    const emptyCoords: number[] = [];
    for (let i = 0; i < totalPoints; i++) {
      const target = isLitByPoint[i] ? litCoords : emptyCoords;
      target.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
    }

    return {
      litPositions: new Float32Array(litCoords),
      emptyPositions: new Float32Array(emptyCoords),
    };
  }, [litCount, positions, revealOrder, totalPoints]);

  const personTexture = useMemo(() => buildPersonTexture(), []);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    group.rotation.y += delta * 0.042;
    const wobble = Math.sin(state.clock.elapsedTime * 0.14) * 0.06;
    group.rotation.x += (wobble - group.rotation.x) * 0.06;

    const litRatio = Math.min(1, litCount / PERSON_POINT_COUNT);
    const targetScale = 1 + litRatio * 0.1 + Math.sin(state.clock.elapsedTime * 0.45) * 0.02;
    group.scale.x += (targetScale - group.scale.x) * 0.06;
    group.scale.y += (targetScale - group.scale.y) * 0.06;
    group.scale.z += (targetScale - group.scale.z) * 0.06;
  });

  return (
    <group ref={groupRef}>
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
          <bufferAttribute attach="attributes-position" args={[litPositions, 3]} />
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
    </group>
  );
}

interface DonationSphereProps {
  onIntroComplete?: () => void;
}

export function DonationSphere({ onIntroComplete }: DonationSphereProps) {
  const { t } = useI18n();
  const { donationCount } = useDonationStats();
  const totalPoints = PERSON_POINT_COUNT;
  const pointData = useMemo(() => createPointData(totalPoints), [totalPoints]);
  const targetLitPoints = Math.min(donationCount * PEOPLE_LIT_PER_DONATION, totalPoints);
  const [animatedLitPoints, setAnimatedLitPoints] = useState(0);
  const animatedLitRef = useRef(0);
  const introDoneRef = useRef(false);
  const introNotifiedRef = useRef(false);

  useEffect(() => {
    const start = animatedLitRef.current;
    const end = targetLitPoints;
    if (start === end) return;

    const stepIntervalMs = introDoneRef.current ? 28 : 48;
    let accumulator = 0;
    let lastAt = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const delta = now - lastAt;
      lastAt = now;
      accumulator += delta;

      let next = animatedLitRef.current;
      while (accumulator >= stepIntervalMs && next !== end) {
        next += end > next ? 1 : -1;
        accumulator -= stepIntervalMs;
      }

      animatedLitRef.current = next;
      setAnimatedLitPoints(next);

      if (next !== end) {
        raf = requestAnimationFrame(tick);
        return;
      }

      introDoneRef.current = true;
      if (!introNotifiedRef.current) {
        introNotifiedRef.current = true;
        onIntroComplete?.();
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onIntroComplete, targetLitPoints]);

  return (
    <section className="donation-sphere-card" aria-live="polite">
      <div className="donation-sphere-canvas-wrap">
        <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 2.05], fov: 42 }}>
          <ambientLight intensity={0.82} />
          <SpinningPointSphere data={pointData} litCount={animatedLitPoints} />
          <OrbitControls
            enablePan={false}
            enableZoom
            autoRotate
            autoRotateSpeed={0.45}
            minPolarAngle={Math.PI / 2 - 0.45}
            maxPolarAngle={Math.PI / 2 + 0.45}
            minDistance={1.65}
            maxDistance={2.5}
            rotateSpeed={0.65}
            dampingFactor={0.08}
            enableDamping
          />
        </Canvas>
      </div>
      <p className="donation-sphere-progress">
        {t('shop.sphereProgress', { count: animatedLitPoints, total: totalPoints })}
      </p>
    </section>
  );
}
*/
