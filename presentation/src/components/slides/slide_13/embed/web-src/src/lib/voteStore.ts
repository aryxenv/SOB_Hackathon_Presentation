const VOTE_COUNTS_KEY = 'sob_vote_counts';

/** Stable empty object so getSnapshot never returns a fresh `{}` each call. */
export const EMPTY_COUNTS: Record<string, number> = Object.freeze({});

let countsCacheJson: string | null = null;
let countsCache: Record<string, number> = EMPTY_COUNTS;

function readCountsRaw(): string {
  return localStorage.getItem(VOTE_COUNTS_KEY) ?? '';
}

export function getCountsSnapshot(): Record<string, number> {
  const raw = readCountsRaw();
  if (raw === countsCacheJson) {
    return countsCache;
  }

  countsCacheJson = raw;

  if (!raw) {
    countsCache = EMPTY_COUNTS;
    return countsCache;
  }

  try {
    countsCache = JSON.parse(raw) as Record<string, number>;
  } catch {
    countsCache = EMPTY_COUNTS;
  }

  return countsCache;
}

export function subscribeVotes(onStoreChange: () => void): () => void {
  const invalidate = () => {
    countsCacheJson = null;
    onStoreChange();
  };

  window.addEventListener('storage', invalidate);
  window.addEventListener('sob-votes-updated', invalidate);

  return () => {
    window.removeEventListener('storage', invalidate);
    window.removeEventListener('sob-votes-updated', invalidate);
  };
}

export function notifyVotesUpdated(): void {
  countsCacheJson = null;
  window.dispatchEvent(new Event('sob-votes-updated'));
}
