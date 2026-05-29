import { useSyncExternalStore } from 'react';
import {
  DEMO_MAX_SINGLE_DONATION_EUROS,
  DEMO_MAX_TOTAL_DONATION_EUROS,
  EURO_PER_LIT_ATHLETE,
} from './donations';
import { allocatePointSlots } from './sphereLayout';
import type { DonationStats } from './storage';
import { DONATIONS_TABLE, getSupabase, isSupabaseConfigured } from './supabaseClient';

/** One lit athlete on the globe (stored with x,y,z so positions never overlap). */
export interface FeedDonation {
  id: string;
  amount: number;
  donorAlias: string | null;
  clientId: string | null;
  pointIndex: number;
  x: number;
  y: number;
  z: number;
  createdAt: string;
  /** True after the landing animation has been shown (persisted in DB). */
  displayed: boolean;
  /** True when this donation came from the current browser. */
  mine: boolean;
}

const CLIENT_ID_KEY = 'sob_client_id';
const LOCAL_FEED_KEY = 'sob_feed_donations';
const POLL_INTERVAL_MS = 5000;

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Stable per-browser id used to tell "my" donations (black) from others (red). */
export function getClientId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = randomId();
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

interface StoredDonation {
  id: string;
  amount: number;
  donorAlias: string | null;
  clientId: string | null;
  pointIndex: number;
  x: number;
  y: number;
  z: number;
  createdAt: string;
  displayed: boolean;
}

function isStoredDonation(entry: unknown): entry is StoredDonation {
  if (!entry || typeof entry !== 'object') return false;
  const row = entry as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    typeof row.amount === 'number' &&
    typeof row.pointIndex === 'number' &&
    typeof row.x === 'number' &&
    typeof row.y === 'number' &&
    typeof row.z === 'number' &&
    typeof row.createdAt === 'string' &&
    (row.displayed === undefined || typeof row.displayed === 'boolean')
  );
}

function withMine(entry: StoredDonation): FeedDonation {
  return {
    ...entry,
    displayed: entry.displayed === true,
    mine: entry.clientId !== null && entry.clientId === getClientId(),
  };
}

function readLocalFeed(): StoredDonation[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(LOCAL_FEED_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isStoredDonation)
      .map((row) => ({ ...row, displayed: row.displayed === true }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  } catch {
    return [];
  }
}

function writeLocalFeed(entries: StoredDonation[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_FEED_KEY, JSON.stringify(entries));
}

function athletesForAmount(amount: number): number {
  return Math.max(1, Math.floor(amount / EURO_PER_LIT_ATHLETE));
}

export type RecordFeedResult =
  | { ok: true; localOnly?: boolean }
  | { ok: false; reason: 'cap' | 'single_cap' | 'slots' | 'remote'; message?: string };

/** Total euros this browser has donated (sum of feed rows with matching client_id). */
export function getMyDonatedEuros(rows?: FeedDonation[]): number {
  const list = rows ?? donations;
  return list.filter((row) => row.mine).reduce((sum, row) => sum + row.amount, 0);
}

/** Total euros donated on the globe (all browsers). */
export function getGlobalDonatedEuros(rows?: FeedDonation[]): number {
  const list = rows ?? donations;
  return list.reduce((sum, row) => sum + row.amount, 0);
}

function computeDonationStats(rows: FeedDonation[]): DonationStats {
  let totalAmount = 0;
  const totalsBySupporter = new Map<string, { amount: number; alias: string | null }>();

  for (const row of rows) {
    totalAmount += row.amount;
    const key = row.clientId ?? row.id;
    const alias = row.donorAlias?.trim() || null;
    const existing = totalsBySupporter.get(key);
    totalsBySupporter.set(key, {
      amount: (existing?.amount ?? 0) + row.amount,
      alias: alias ?? existing?.alias ?? null,
    });
  }

  let topDonorAlias: string | null = null;
  let topDonorAmount = 0;
  for (const { amount, alias } of totalsBySupporter.values()) {
    if (amount > topDonorAmount) {
      topDonorAmount = amount;
      topDonorAlias = alias;
    }
  }

  return {
    totalAmount,
    donationCount: rows.length,
    topDonorAlias,
    topDonorAmount,
  };
}

export function getDonationStatsFromFeed(): DonationStats {
  return computeDonationStats(donations);
}

export function exceedsSingleDonationCap(amount: number): boolean {
  return amount > DEMO_MAX_SINGLE_DONATION_EUROS;
}

export function wouldExceedTotalDemoCap(amount: number, rows?: FeedDonation[]): boolean {
  return getMyDonatedEuros(rows) + amount > DEMO_MAX_TOTAL_DONATION_EUROS;
}

/** @deprecated Use {@link wouldExceedTotalDemoCap}. */
export function wouldExceedDemoCap(amount: number, rows?: FeedDonation[]): boolean {
  return wouldExceedTotalDemoCap(amount, rows);
}

export {
  DEMO_MAX_SINGLE_DONATION_EUROS,
  DEMO_MAX_TOTAL_DONATION_EUROS,
  DEMO_MAX_DONATION_EUROS,
} from './donations';

export async function recordFeedDonation(
  amount: number,
  donorAlias: string | null,
): Promise<RecordFeedResult> {
  const clientId = getClientId();
  const athleteCount = athletesForAmount(amount);
  const perAthleteAmount = EURO_PER_LIT_ATHLETE;
  const createdAt = new Date().toISOString();

  if (amount > DEMO_MAX_SINGLE_DONATION_EUROS) {
    return { ok: false, reason: 'single_cap' };
  }

  const existing = await fetchDonations();
  const myTotal = existing
    .filter((row) => row.clientId === clientId)
    .reduce((sum, row) => sum + row.amount, 0);
  if (myTotal + amount > DEMO_MAX_TOTAL_DONATION_EUROS) {
    return { ok: false, reason: 'cap' };
  }

  const usedIndices = existing.map((row) => row.pointIndex);
  const slots = allocatePointSlots(usedIndices, athleteCount);
  if (slots.length < athleteCount) {
    console.warn('No free athlete slots left on the globe.');
    return { ok: false, reason: 'slots' };
  }

  const rows: StoredDonation[] = slots.map((slot) => ({
    id: randomId(),
    amount: perAthleteAmount,
    donorAlias,
    clientId,
    pointIndex: slot.pointIndex,
    x: slot.x,
    y: slot.y,
    z: slot.z,
    createdAt,
    displayed: false,
  }));

  const supabase = getSupabase();
  if (supabase) {
    // One row at a time so the DB cap trigger sees prior rows in the same donation.
    for (const row of rows) {
      const { error } = await supabase.from(DONATIONS_TABLE).insert({
        amount: row.amount,
        donor_alias: row.donorAlias,
        client_id: row.clientId,
        point_index: row.pointIndex,
        x: row.x,
        y: row.y,
        z: row.z,
        created_at: row.createdAt,
      });
      if (error) {
        void refresh();
        const msg = error.message.toLowerCase();
        if (msg.includes('demo_donation_cap') || msg.includes('300')) {
          return { ok: false, reason: 'cap', message: error.message };
        }
        return {
          ok: false,
          reason: 'remote',
          message: error.hint ? `${error.message} (${error.hint})` : error.message,
        };
      }
    }
    void refresh();
    return { ok: true };
  }

  const local = readLocalFeed();
  const localMyTotal = local
    .filter((row) => row.clientId === clientId)
    .reduce((sum, row) => sum + row.amount, 0);
  if (localMyTotal + amount > DEMO_MAX_TOTAL_DONATION_EUROS) {
    return { ok: false, reason: 'cap' };
  }
  writeLocalFeed(dedupeDonations([...local, ...rows]));
  void refresh();
  return { ok: true, localOnly: true };
}

function dedupeDonations(rows: StoredDonation[]): StoredDonation[] {
  const seenIds = new Set<string>();
  const seenPoints = new Set<number>();
  const unique: StoredDonation[] = [];
  for (const row of rows) {
    if (seenIds.has(row.id)) continue;
    if (seenPoints.has(row.pointIndex)) continue;
    seenIds.add(row.id);
    seenPoints.add(row.pointIndex);
    unique.push(row);
  }
  return unique.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

async function fetchDonations(): Promise<StoredDonation[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from(DONATIONS_TABLE)
      .select('id, amount, donor_alias, client_id, point_index, x, y, z, created_at, displayed')
      .order('created_at', { ascending: true });

    if (error) {
      return [];
    }

    if (Array.isArray(data)) {
      const mapped = data
        .map((row) => ({
          id: String(row.id),
          amount: row.amount,
          donorAlias: row.donor_alias ?? null,
          clientId: row.client_id ?? null,
          pointIndex: row.point_index,
          x: row.x,
          y: row.y,
          z: row.z,
          createdAt: row.created_at ?? new Date().toISOString(),
          displayed: row.displayed === true,
        }))
        .filter(
          (row): row is StoredDonation =>
            Number.isInteger(row.pointIndex) &&
            row.pointIndex >= 0 &&
            Number.isFinite(row.x) &&
            Number.isFinite(row.y) &&
            Number.isFinite(row.z),
        );
      return dedupeDonations(mapped);
    }
    return [];
  }
  return dedupeDonations(readLocalFeed());
}

function patchDisplayedInSnapshot(ids: Iterable<string>): boolean {
  const idSet = new Set(ids);
  if (idSet.size === 0) return false;
  let changed = false;
  donations = donations.map((row) => {
    if (!idSet.has(row.id) || row.displayed) return row;
    changed = true;
    return { ...row, displayed: true };
  });
  return changed;
}

/** Persist displayed=true (batch). Safe to call with many ids. */
export async function markDonationsDisplayedBatch(ids: string[]): Promise<void> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return;

  if (patchDisplayedInSnapshot(unique)) emit();

  const supabase = getSupabase();
  if (supabase) {
    const chunkSize = 100;
    for (let offset = 0; offset < unique.length; offset += chunkSize) {
      const chunk = unique.slice(offset, offset + chunkSize);
      await supabase.from(DONATIONS_TABLE).update({ displayed: true }).in('id', chunk).eq('displayed', false);
    }
    return;
  }

  const local = readLocalFeed();
  const idSet = new Set(unique);
  writeLocalFeed(local.map((row) => (idSet.has(row.id) ? { ...row, displayed: true } : row)));
}

/** Mark a feed row as animated so refresh skips the meteor queue. */
export async function markDonationDisplayed(id: string): Promise<void> {
  await markDonationsDisplayedBatch([id]);
}

// ---- Shared store (single poller, many React consumers) ----

let donations: FeedDonation[] = [];
let feedHydrated = false;
/** First fetch this page load: treat everything already in DB as displayed. */
let feedBootstrapped = false;
const listeners = new Set<() => void>();
let pollId: number | null = null;

function emit(): void {
  for (const listener of listeners) listener();
}

function feedSignature(feed: FeedDonation[]): string {
  return feed.map((row) => `${row.id}:${row.displayed ? 1 : 0}`).join('\n');
}

function sameFeed(a: FeedDonation[], b: FeedDonation[]): boolean {
  if (a.length !== b.length) return false;
  return feedSignature(a) === feedSignature(b);
}

function mergeDisplayedFromPrevious(fetched: FeedDonation[]): FeedDonation[] {
  return fetched.map((row) => ({
    ...row,
    displayed: row.displayed || donations.some((existing) => existing.id === row.id && existing.displayed),
  }));
}

async function refresh(): Promise<void> {
  const fetched = (await fetchDonations()).map(withMine);
  let next: FeedDonation[];

  if (!feedBootstrapped) {
    feedBootstrapped = true;
    const undisplayedIds = fetched.filter((row) => !row.displayed).map((row) => row.id);
    if (undisplayedIds.length > 0) {
      void markDonationsDisplayedBatch(undisplayedIds);
    }
    // Page load / refresh: everything already in the DB lights up instantly.
    next = fetched.map((row) => ({ ...row, displayed: true }));
  } else {
    // Poll: only rows that are still false in DB and were never shown this session animate.
    next = mergeDisplayedFromPrevious(fetched);
  }

  const firstLoad = !feedHydrated;
  feedHydrated = true;
  if (firstLoad || !sameFeed(next, donations)) {
    donations = next;
    emit();
  }
}

function onFocus(): void {
  void refresh();
}

function startPolling(): void {
  if (pollId !== null) return;
  void refresh();
  pollId = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);
  window.addEventListener('focus', onFocus);
}

function stopPolling(): void {
  if (pollId === null) return;
  window.clearInterval(pollId);
  pollId = null;
  window.removeEventListener('focus', onFocus);
}

export function subscribeDonations(listener: () => void): () => void {
  listeners.add(listener);
  startPolling();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stopPolling();
  };
}

export function getDonationsSnapshot(): FeedDonation[] {
  return donations;
}

export function getFeedHydrated(): boolean {
  return feedHydrated;
}

export function useFeedHydrated(): boolean {
  return useSyncExternalStore(subscribeDonations, getFeedHydrated, () => false);
}

const EMPTY: FeedDonation[] = [];

export function useDonationFeed(): FeedDonation[] {
  return useSyncExternalStore(subscribeDonations, getDonationsSnapshot, () => EMPTY);
}

export { isSupabaseConfigured };
