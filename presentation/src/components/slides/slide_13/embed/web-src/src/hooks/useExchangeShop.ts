import { useCallback, useSyncExternalStore } from 'react';
import {
  getExchangePoints,
  getExchangeRedemptions,
  redeemExchangeReward,
  type ExchangeRedemptionEntry,
} from '../lib/storage';
import { notifyVotesUpdated, subscribeVotes } from '../lib/voteStore';

const EMPTY_REDEMPTIONS: ExchangeRedemptionEntry[] = [];

let redemptionsCacheJson: string | null = null;
let redemptionsCache: ExchangeRedemptionEntry[] = EMPTY_REDEMPTIONS;

function getExchangePointsSnapshot(): number {
  return getExchangePoints();
}

function getRedemptionsSnapshot(): ExchangeRedemptionEntry[] {
  const raw = localStorage.getItem('sob_exchange_redemptions') ?? '';
  if (raw === redemptionsCacheJson) {
    return redemptionsCache;
  }

  redemptionsCacheJson = raw;
  const entries = getExchangeRedemptions();
  redemptionsCache = entries.length === 0 ? EMPTY_REDEMPTIONS : entries;
  return redemptionsCache;
}

export function useExchangeShop() {
  const points = useSyncExternalStore(subscribeVotes, getExchangePointsSnapshot, () => 0);
  const redemptions = useSyncExternalStore(subscribeVotes, getRedemptionsSnapshot, () => EMPTY_REDEMPTIONS);

  const redeem = useCallback((rewardId: string, pointsCost: number) => {
    const ok = redeemExchangeReward(rewardId, pointsCost);
    notifyVotesUpdated();
    return ok;
  }, []);

  return { points, redemptions, redeem };
}
