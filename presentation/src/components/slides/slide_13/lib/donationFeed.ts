import { useSyncExternalStore } from "react";
import { DONATIONS_TABLE, getSupabase, isSupabaseConfigured } from "./supabaseClient";

/** One lit athlete on the globe, sourced from a Supabase `donations` row.
 *  This is a passive viewer ("another device"): every row reads as incoming
 *  (`mine = false`) and we never write/depend on the `displayed` flag. */
export interface FeedDonation {
  id: string;
  amount: number;
  donorAlias: string | null;
  pointIndex: number;
  x: number;
  y: number;
  z: number;
  createdAt: string;
  /** Always false here — the big globe treats donations as incoming. */
  mine: boolean;
}

const POLL_INTERVAL_MS = 2500;

interface RawRow {
  id: unknown;
  amount: unknown;
  donor_alias: unknown;
  point_index: unknown;
  x: unknown;
  y: unknown;
  z: unknown;
  created_at: unknown;
}

function mapRow(row: RawRow): FeedDonation | null {
  const pointIndex = Number(row.point_index);
  const x = Number(row.x);
  const y = Number(row.y);
  const z = Number(row.z);
  if (
    !Number.isInteger(pointIndex) ||
    pointIndex < 0 ||
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(z)
  ) {
    return null;
  }
  return {
    id: String(row.id),
    amount: Number(row.amount) || 0,
    donorAlias: typeof row.donor_alias === "string" ? row.donor_alias : null,
    pointIndex,
    x,
    y,
    z,
    createdAt: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
    mine: false,
  };
}

function dedupe(rows: FeedDonation[]): FeedDonation[] {
  const seenIds = new Set<string>();
  const seenPoints = new Set<number>();
  const unique: FeedDonation[] = [];
  for (const row of rows) {
    if (seenIds.has(row.id) || seenPoints.has(row.pointIndex)) continue;
    seenIds.add(row.id);
    seenPoints.add(row.pointIndex);
    unique.push(row);
  }
  return unique.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// ---- Shared store (single poller/realtime, many React consumers) ----

let donations: FeedDonation[] = [];
let hydrated = false;
const listeners = new Set<() => void>();
let pollId: number | null = null;
let realtimeChannel: ReturnType<NonNullable<ReturnType<typeof getSupabase>>["channel"]> | null = null;

function emit(): void {
  for (const listener of listeners) listener();
}

function signature(rows: FeedDonation[]): string {
  return rows.map((row) => row.id).join("\n");
}

async function fetchAll(): Promise<FeedDonation[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from(DONATIONS_TABLE)
    .select("id, amount, donor_alias, point_index, x, y, z, created_at")
    .order("created_at", { ascending: true });
  if (error || !Array.isArray(data)) return [];
  const mapped = data
    .map((row) => mapRow(row as RawRow))
    .filter((row): row is FeedDonation => row !== null);
  return dedupe(mapped);
}

async function refresh(): Promise<void> {
  const next = await fetchAll();
  hydrated = true;
  if (signature(next) !== signature(donations)) {
    donations = next;
  }
  emit();
}

function appendRealtimeRow(raw: RawRow): void {
  const mapped = mapRow(raw);
  if (!mapped) return;
  if (donations.some((row) => row.id === mapped.id || row.pointIndex === mapped.pointIndex)) {
    return;
  }
  donations = dedupe([...donations, mapped]);
  emit();
}

function start(): void {
  if (!isSupabaseConfigured) {
    hydrated = true;
    emit();
    return;
  }
  if (pollId !== null) return;

  void refresh();

  const supabase = getSupabase();
  if (supabase) {
    realtimeChannel = supabase
      .channel("slide13-donations")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: DONATIONS_TABLE },
        (payload) => appendRealtimeRow(payload.new as RawRow),
      )
      .subscribe();
  }

  // Polling fallback also catches rows missed if realtime is disabled.
  pollId = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);
  window.addEventListener("focus", onFocus);
}

function onFocus(): void {
  void refresh();
}

function stop(): void {
  if (pollId !== null) {
    window.clearInterval(pollId);
    pollId = null;
  }
  window.removeEventListener("focus", onFocus);
  if (realtimeChannel) {
    const supabase = getSupabase();
    void supabase?.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  start();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stop();
  };
}

function getSnapshot(): FeedDonation[] {
  return donations;
}

const EMPTY: FeedDonation[] = [];

export function useDonationFeed(): FeedDonation[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

export function useFeedHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => hydrated,
    () => false,
  );
}

export function getTotalEuros(rows: FeedDonation[]): number {
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

export { isSupabaseConfigured };
