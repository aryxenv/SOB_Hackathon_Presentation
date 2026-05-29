import { getDonationHistory } from './storage';
import { EURO_PER_LIT_ATHLETE } from './donations';
import type { Player } from '../types';

const REVEALED_ATHLETES_KEY = 'sob_revealed_athletes';
const FAVORITE_CLUB_KEY = 'sob_favorite_club_by_user';

export interface RevealedAthlete {
  donationId: string;
  playerId: string;
  revealedAt: string;
}

export interface PersonalImpact {
  totalDonated: number;
  donationCount: number;
  litAthletes: number;
  revealedAthletes: number;
}

export interface MonthlySupporter {
  alias: string;
  amount: number;
  rising: boolean;
}

function hashText(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) % 100000;
  }
  return Math.abs(hash);
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function getDonorKey(email: string, name: string, fallback = ''): string {
  return normalize(email) || normalize(name) || fallback;
}

function donorAlias(key: string): string {
  const id = (hashText(key) % 900) + 100;
  return `Supporter #${id}`;
}

function readRevealedAthletes(): RevealedAthlete[] {
  const raw = localStorage.getItem(REVEALED_ATHLETES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as RevealedAthlete[];
  } catch {
    return [];
  }
}

function writeRevealedAthletes(entries: RevealedAthlete[]): void {
  localStorage.setItem(REVEALED_ATHLETES_KEY, JSON.stringify(entries));
}

function readFavoriteClubsByUser(): Record<string, string> {
  const raw = localStorage.getItem(FAVORITE_CLUB_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

function writeFavoriteClubsByUser(value: Record<string, string>): void {
  localStorage.setItem(FAVORITE_CLUB_KEY, JSON.stringify(value));
}

export function getRevealedAthletes(): RevealedAthlete[] {
  return readRevealedAthletes();
}

export function revealAthleteForDonation(donationId: string, players: Player[]): RevealedAthlete | null {
  if (!donationId || players.length === 0) return null;
  const current = readRevealedAthletes();
  const existing = current.find((entry) => entry.donationId === donationId);
  if (existing) return existing;

  const revealedIds = new Set(current.map((entry) => entry.playerId));
  const pool = players.filter((player) => !revealedIds.has(player.id));
  if (pool.length === 0) return null;

  const pickIndex = hashText(donationId) % pool.length;
  const selected = pool[pickIndex];
  if (!selected) return null;

  const next: RevealedAthlete = {
    donationId,
    playerId: selected.id,
    revealedAt: new Date().toISOString(),
  };
  current.push(next);
  writeRevealedAthletes(current);
  return next;
}

export function getCollectedCardsForIdentity(email: string, name: string, players: Player[]): Player[] {
  const donorKey = getDonorKey(email, name);
  const ownDonationIds = new Set(
    getDonationHistory()
      .filter((entry) => getDonorKey(entry.email, entry.name, entry.id) === donorKey)
      .map((entry) => entry.id),
  );

  const playerById = new Map(players.map((player) => [player.id, player]));
  const seen = new Set<string>();
  const collected: Player[] = [];
  for (const reveal of getRevealedAthletes()) {
    if (!ownDonationIds.has(reveal.donationId)) continue;
    if (seen.has(reveal.playerId)) continue;
    const player = playerById.get(reveal.playerId);
    if (!player) continue;
    seen.add(reveal.playerId);
    collected.push(player);
  }
  return collected;
}

export function getFavoriteClub(email: string, name: string): string | null {
  const map = readFavoriteClubsByUser();
  const key = getDonorKey(email, name);
  return map[key] ?? null;
}

export function setFavoriteClub(email: string, name: string, club: string): void {
  const map = readFavoriteClubsByUser();
  const key = getDonorKey(email, name);
  if (!key) return;
  map[key] = club;
  writeFavoriteClubsByUser(map);
}

export function getPersonalImpact(email: string, name: string): PersonalImpact {
  const history = getDonationHistory();
  const key = getDonorKey(email, name);
  const ownDonations = history.filter((entry) => getDonorKey(entry.email, entry.name, entry.id) === key);
  const totalDonated = ownDonations.reduce((sum, entry) => sum + entry.amount, 0);
  const donationCount = ownDonations.length;
  const ownDonationIds = new Set(ownDonations.map((entry) => entry.id));
  const revealedAthletes = getRevealedAthletes().filter((entry) => ownDonationIds.has(entry.donationId)).length;

  return {
    totalDonated,
    donationCount,
    litAthletes: Math.floor(totalDonated / EURO_PER_LIT_ATHLETE),
    revealedAthletes,
  };
}

export function getMonthlySupportersBoard(limit = 5): MonthlySupporter[] {
  const history = getDonationHistory();
  const now = new Date();
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const prevDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const prevKey = `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, '0')}`;

  const currentTotals = new Map<string, number>();
  const previousTotals = new Map<string, number>();

  for (const donation of history) {
    const date = new Date(donation.at);
    if (Number.isNaN(date.getTime())) continue;
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    const donorKey = getDonorKey(donation.email, donation.name, donation.id);
    if (!donorKey) continue;

    if (key === monthKey) {
      currentTotals.set(donorKey, (currentTotals.get(donorKey) ?? 0) + donation.amount);
    } else if (key === prevKey) {
      previousTotals.set(donorKey, (previousTotals.get(donorKey) ?? 0) + donation.amount);
    }
  }

  return [...currentTotals.entries()]
    .map(([key, amount]) => {
      const prev = previousTotals.get(key) ?? 0;
      return {
        alias: donorAlias(key),
        amount,
        rising: amount > prev,
      };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}
