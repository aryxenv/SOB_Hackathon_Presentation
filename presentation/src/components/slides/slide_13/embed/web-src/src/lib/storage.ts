import { notifySessionUpdated } from './session';
import { notifyVotesUpdated } from './voteStore';
import { EXCHANGE_POINTS_PER_EURO } from './donations';

const VOTES_KEY = 'sob_vote_credits';
const VOTE_COUNTS_KEY = 'sob_vote_counts';
const DONATION_HISTORY_KEY = 'sob_donations';
const MOTIVATION_KEY = 'sob_motivations';
const DONOR_PROFILE_KEY = 'sob_donor_profile';
const LAST_DONATION_KEY = 'sob_last_donation_id';
const EXCHANGE_POINTS_KEY = 'sob_exchange_points';
const EXCHANGE_REDEMPTIONS_KEY = 'sob_exchange_redemptions';

export type PaymentFrequency = 'one-time' | 'monthly';

export interface DonorProfile {
  email: string;
  name: string;
}

export interface DonationEntry {
  id: string;
  amount: number;
  votes: number;
  frequency: PaymentFrequency;
  email: string;
  name: string;
  at: string;
}

export interface DonationStats {
  totalAmount: number;
  donationCount: number;
  topDonorAlias: string | null;
  topDonorAmount: number;
}

const EMPTY_DONATION_STATS: DonationStats = Object.freeze({
  totalAmount: 0,
  donationCount: 0,
  topDonorAlias: null,
  topDonorAmount: 0,
});

let donationStatsCacheJson: string | null = null;
let donationStatsCache: DonationStats = EMPTY_DONATION_STATS;

export interface MotivationEntry {
  id: string;
  donationId: string | null;
  name: string;
  email: string;
  region: string;
  motivation: string;
  connection: string;
  at: string;
}

export interface ExchangeRedemptionEntry {
  id: string;
  rewardId: string;
  pointsSpent: number;
  at: string;
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getVoteCredits(): number {
  const raw = localStorage.getItem(VOTES_KEY);
  return raw ? Number.parseInt(raw, 10) : 0;
}

export function addVoteCredits(amount: number): void {
  const current = getVoteCredits();
  localStorage.setItem(VOTES_KEY, String(current + amount));
}

export function getExchangePoints(): number {
  const raw = localStorage.getItem(EXCHANGE_POINTS_KEY);
  return raw ? Number.parseInt(raw, 10) : 0;
}

export function addExchangePoints(amount: number): void {
  const current = getExchangePoints();
  localStorage.setItem(EXCHANGE_POINTS_KEY, String(current + Math.max(0, Math.floor(amount))));
}

export function useVoteCredit(): boolean {
  const current = getVoteCredits();
  if (current <= 0) return false;
  localStorage.setItem(VOTES_KEY, String(current - 1));
  return true;
}

export function getVoteCounts(): Record<string, number> {
  const raw = localStorage.getItem(VOTE_COUNTS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

export function castVote(playerId: string): boolean {
  if (!useVoteCredit()) return false;
  const counts = getVoteCounts();
  counts[playerId] = (counts[playerId] ?? 0) + 1;
  localStorage.setItem(VOTE_COUNTS_KEY, JSON.stringify(counts));
  return true;
}

export function getDonorProfile(): DonorProfile | null {
  const raw = localStorage.getItem(DONOR_PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DonorProfile;
  } catch {
    return null;
  }
}

export function saveDonorProfile(profile: DonorProfile): void {
  localStorage.setItem(DONOR_PROFILE_KEY, JSON.stringify(profile));
}

export function getLastDonationId(): string | null {
  return localStorage.getItem(LAST_DONATION_KEY);
}

export function recordDonation(
  amount: number,
  votesGranted: number,
  frequency: PaymentFrequency,
  donor: DonorProfile,
): string {
  const id = newId();
  const raw = localStorage.getItem(DONATION_HISTORY_KEY);
  const history: DonationEntry[] = raw
    ? (JSON.parse(raw) as Partial<DonationEntry>[]).map((entry) => ({
        id: entry.id ?? newId(),
        amount: entry.amount ?? 0,
        votes: entry.votes ?? 0,
        frequency: entry.frequency ?? 'one-time',
        email: entry.email ?? '',
        name: entry.name ?? '',
        at: entry.at ?? new Date().toISOString(),
      }))
    : [];

  history.push({
    id,
    amount,
    votes: votesGranted,
    frequency,
    email: donor.email.trim(),
    name: donor.name.trim(),
    at: new Date().toISOString(),
  });

  localStorage.setItem(DONATION_HISTORY_KEY, JSON.stringify(history));
  localStorage.setItem(LAST_DONATION_KEY, id);
  saveDonorProfile(donor);
  addVoteCredits(votesGranted);
  addExchangePoints(amount * EXCHANGE_POINTS_PER_EURO);
  notifySessionUpdated();
  notifyVotesUpdated();
  return id;
}

function readDonationHistory(): DonationEntry[] {
  const raw = localStorage.getItem(DONATION_HISTORY_KEY);
  if (!raw) return [];

  try {
    return (JSON.parse(raw) as Partial<DonationEntry>[]).map((entry) => ({
      id: entry.id ?? newId(),
      amount: entry.amount ?? 0,
      votes: entry.votes ?? 0,
      frequency: entry.frequency ?? 'one-time',
      email: entry.email ?? '',
      name: entry.name ?? '',
      at: entry.at ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export function getDonationHistory(): DonationEntry[] {
  return readDonationHistory();
}

function aliasForDonor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  }
  const id = (Math.abs(hash) % 900) + 100;
  return `Supporter #${id}`;
}

export function getDonationStats(): DonationStats {
  const raw = localStorage.getItem(DONATION_HISTORY_KEY) ?? '';
  if (raw === donationStatsCacheJson) {
    return donationStatsCache;
  }

  donationStatsCacheJson = raw;
  const history = readDonationHistory();
  if (history.length === 0) {
    donationStatsCache = EMPTY_DONATION_STATS;
    return donationStatsCache;
  }

  let totalAmount = 0;
  const totalsByDonor = new Map<string, number>();

  for (const entry of history) {
    totalAmount += entry.amount;
    const donorKey = entry.email.trim().toLowerCase() || entry.name.trim().toLowerCase() || entry.id;
    totalsByDonor.set(donorKey, (totalsByDonor.get(donorKey) ?? 0) + entry.amount);
  }

  let topDonorKey: string | null = null;
  let topDonorAmount = 0;

  for (const [key, amount] of totalsByDonor.entries()) {
    if (amount > topDonorAmount) {
      topDonorAmount = amount;
      topDonorKey = key;
    }
  }

  donationStatsCache = {
    totalAmount,
    donationCount: history.length,
    topDonorAlias: topDonorKey ? aliasForDonor(topDonorKey) : null,
    topDonorAmount,
  };
  return donationStatsCache;
}

export function recordMotivation(entry: {
  donationId: string | null;
  name: string;
  email: string;
  region: string;
  motivation: string;
  connection: string;
}): void {
  const raw = localStorage.getItem(MOTIVATION_KEY);
  const entries: MotivationEntry[] = raw
    ? (JSON.parse(raw) as Partial<MotivationEntry>[]).map((e) => ({
        id: e.id ?? newId(),
        donationId: e.donationId ?? null,
        name: e.name ?? '',
        email: e.email ?? '',
        region: e.region ?? '',
        motivation: e.motivation ?? '',
        connection: e.connection ?? '',
        at: e.at ?? new Date().toISOString(),
      }))
    : [];

  entries.push({
    id: newId(),
    donationId: entry.donationId,
    name: entry.name.trim(),
    email: entry.email.trim(),
    region: entry.region,
    motivation: entry.motivation.trim(),
    connection: entry.connection.trim(),
    at: new Date().toISOString(),
  });

  localStorage.setItem(MOTIVATION_KEY, JSON.stringify(entries));
  saveDonorProfile({ email: entry.email.trim(), name: entry.name.trim() });
  addVoteCredits(1);
  notifySessionUpdated();
  notifyVotesUpdated();
}

function readExchangeRedemptions(): ExchangeRedemptionEntry[] {
  const raw = localStorage.getItem(EXCHANGE_REDEMPTIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ExchangeRedemptionEntry[];
  } catch {
    return [];
  }
}

export function getExchangeRedemptions(): ExchangeRedemptionEntry[] {
  return readExchangeRedemptions();
}

export function redeemExchangeReward(rewardId: string, pointsCost: number): boolean {
  if (pointsCost <= 0) return false;
  const points = getExchangePoints();
  if (points < pointsCost) return false;

  localStorage.setItem(EXCHANGE_POINTS_KEY, String(points - pointsCost));

  const redemptions = readExchangeRedemptions();
  redemptions.push({
    id: newId(),
    rewardId,
    pointsSpent: pointsCost,
    at: new Date().toISOString(),
  });
  localStorage.setItem(EXCHANGE_REDEMPTIONS_KEY, JSON.stringify(redemptions));
  notifyVotesUpdated();
  return true;
}
