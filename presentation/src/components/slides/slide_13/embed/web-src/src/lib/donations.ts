import type { DonationTier } from '../types';

/** Quick-pick amounts — votes are always computed from the euro total. */
export const DONATION_TIERS: DonationTier[] = [
  { amount: 5, labelKey: 'donate.tier.small' },
  { amount: 15, labelKey: 'donate.tier.medium' },
  { amount: 50, labelKey: 'donate.tier.large' },
];

export const BONUS_VOTE_FOR_MOTIVATION = 1;

/** 1 vote per €5 donated — scales without cap. */
export const EUROS_PER_VOTE = 5;
export const EXCHANGE_POINTS_PER_EURO = 10;
export const EURO_PER_LIT_ATHLETE = 25;

/** Max euros in a single donation (one checkout). */
export const DEMO_MAX_SINGLE_DONATION_EUROS = 300;

/** Demo cap per browser total (no registration — tracked via client_id). */
export const DEMO_MAX_TOTAL_DONATION_EUROS = 500;

/** @deprecated Use {@link DEMO_MAX_TOTAL_DONATION_EUROS}. */
export const DEMO_MAX_DONATION_EUROS = DEMO_MAX_TOTAL_DONATION_EUROS;

export function votesForAmount(amount: number): number {
  if (amount < EUROS_PER_VOTE) return 0;
  return Math.floor(amount / EUROS_PER_VOTE);
}

export function exchangePointsForAmount(amount: number): number {
  return Math.max(0, Math.floor(amount * EXCHANGE_POINTS_PER_EURO));
}
