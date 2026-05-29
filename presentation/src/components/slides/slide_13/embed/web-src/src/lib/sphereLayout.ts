/** Shared globe geometry: fixed point positions and reveal order (used by feed + 3D sphere). */

export const PERSON_POINT_COUNT = 7000;
export const GLOBE_RADIUS = 0.68;
export const DEFAULT_PRELIT_ATHLETES = 100;

function seededRandom(seed: number): number {
  const value = Math.sin(seed * 913.13) * 10000;
  return value - Math.floor(value);
}

function buildRevealOrder(positions: Float32Array, totalPoints: number): number[] {
  const LAT_BANDS = 18;
  const LON_SECTORS = 36;
  const buckets = new Map<string, number[]>();

  for (let idx = 0; idx < totalPoints; idx++) {
    const x = positions[idx * 3];
    const y = positions[idx * 3 + 1];
    const z = positions[idx * 3 + 2];
    const yNormalized = (y + GLOBE_RADIUS) / (GLOBE_RADIUS * 2);
    const latBand = Math.max(0, Math.min(LAT_BANDS - 1, Math.floor(yNormalized * LAT_BANDS)));
    const lon = Math.atan2(x, z);
    const lonNormalized = (lon + Math.PI) / (Math.PI * 2);
    const sector = Math.max(0, Math.min(LON_SECTORS - 1, Math.floor(lonNormalized * LON_SECTORS)));
    const key = `${latBand}:${sector}`;
    const list = buckets.get(key) ?? [];
    list.push(idx);
    buckets.set(key, list);
  }

  for (const [key, list] of buckets.entries()) {
    const seedBase = Number.parseInt(key.replace(':', ''), 10) || 1;
    list.sort((a, b) => seededRandom(a + seedBase) - seededRandom(b + seedBase));
  }

  const mid = Math.floor(LAT_BANDS / 2);
  const latSweep: number[] = [];
  for (let offset = 0; offset < LAT_BANDS; offset++) {
    const up = mid + offset;
    const down = mid - offset - 1;
    if (up < LAT_BANDS) latSweep.push(up);
    if (down >= 0) latSweep.push(down);
  }

  const revealOrder: number[] = [];
  let pass = 0;
  let hasItems = true;
  while (hasItems) {
    hasItems = false;
    for (const latBand of latSweep) {
      for (let step = 0; step < LON_SECTORS; step++) {
        const sector = (step * 11 + pass * 3 + latBand * 2) % LON_SECTORS;
        const key = `${latBand}:${sector}`;
        const list = buckets.get(key);
        if (list && list.length > 0) {
          const next = list.shift();
          if (typeof next === 'number') {
            revealOrder.push(next);
            hasItems = true;
          }
        }
      }
    }
    pass += 1;
  }

  return revealOrder.length > 0 ? revealOrder : Array.from({ length: totalPoints }, (_, i) => i);
}

function createPositions(totalPoints: number): Float32Array {
  const positions = new Float32Array(totalPoints * 3);
  let seed = 1337;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < totalPoints; i++) {
    const t = (i + 0.5) / totalPoints;
    const y = 1 - 2 * t;
    const radial = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    const x = Math.cos(theta) * radial;
    const z = Math.sin(theta) * radial;
    const jitter = (random() - 0.5) * 0.006;
    const r = GLOBE_RADIUS + jitter;
    positions[i * 3] = x * r;
    positions[i * 3 + 1] = y * r;
    positions[i * 3 + 2] = z * r;
  }
  return positions;
}

let cachedPositions: Float32Array | null = null;
let cachedRevealOrder: number[] | null = null;

export function getSphereLayout(): { positions: Float32Array; revealOrder: number[] } {
  if (!cachedPositions || !cachedRevealOrder) {
    cachedPositions = createPositions(PERSON_POINT_COUNT);
    cachedRevealOrder = buildRevealOrder(cachedPositions, PERSON_POINT_COUNT);
  }
  return { positions: cachedPositions, revealOrder: cachedRevealOrder };
}

export interface PointCoords {
  pointIndex: number;
  x: number;
  y: number;
  z: number;
}

export function getPointCoords(pointIndex: number): PointCoords {
  const { positions } = getSphereLayout();
  return {
    pointIndex,
    x: positions[pointIndex * 3],
    y: positions[pointIndex * 3 + 1],
    z: positions[pointIndex * 3 + 2],
  };
}

/** Next N unused athlete slots (after baseline + already-used indices). */
export function allocatePointSlots(usedPointIndices: Iterable<number>, count: number): PointCoords[] {
  const { revealOrder } = getSphereLayout();
  const baseline = Math.min(DEFAULT_PRELIT_ATHLETES, revealOrder.length);
  const used = new Set<number>(usedPointIndices);
  for (let i = 0; i < baseline; i++) {
    used.add(revealOrder[i]);
  }

  const slots: PointCoords[] = [];
  for (let slot = baseline; slot < revealOrder.length && slots.length < count; slot++) {
    const pointIndex = revealOrder[slot];
    if (used.has(pointIndex)) continue;
    used.add(pointIndex);
    slots.push(getPointCoords(pointIndex));
  }
  return slots;
}
