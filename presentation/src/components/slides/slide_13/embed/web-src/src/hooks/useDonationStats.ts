import { useSyncExternalStore } from 'react';
import { getDonationStatsFromFeed, subscribeDonations } from '../lib/donationFeed';
import type { DonationStats } from '../lib/storage';

const EMPTY_DONATION_STATS: DonationStats = {
  totalAmount: 0,
  donationCount: 0,
  topDonorAlias: null,
  topDonorAmount: 0,
};

/** Community-wide totals from the shared donation feed (Supabase or local fallback). */
export function useDonationStats(): DonationStats {
  return useSyncExternalStore(subscribeDonations, getDonationStatsFromFeed, () => EMPTY_DONATION_STATS);
}
