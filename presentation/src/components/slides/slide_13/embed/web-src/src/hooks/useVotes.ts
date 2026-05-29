import { useCallback, useSyncExternalStore } from 'react';
import { castVote, getVoteCredits } from '../lib/storage';
import {
  EMPTY_COUNTS,
  getCountsSnapshot,
  notifyVotesUpdated,
  subscribeVotes,
} from '../lib/voteStore';

function getCreditsSnapshot(): number {
  return getVoteCredits();
}

export function useVotes() {
  const credits = useSyncExternalStore(subscribeVotes, getCreditsSnapshot, () => 0);
  const counts = useSyncExternalStore(subscribeVotes, getCountsSnapshot, () => EMPTY_COUNTS);

  const vote = useCallback((playerId: string) => {
    const ok = castVote(playerId);
    notifyVotesUpdated();
    return ok;
  }, []);

  const refresh = useCallback(() => notifyVotesUpdated(), []);

  return { credits, counts, vote, refresh };
}
