import { useEffect, useState } from 'react';
import { loadEvents, loadPlayers } from '../lib/csv';
import type { Event, Player } from '../types';

export function useData() {
  const [events, setEvents] = useState<Event[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [e, p] = await Promise.all([loadEvents(), loadPlayers()]);
        if (!cancelled) {
          setEvents(e);
          setPlayers(p);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { events, players, loading, error };
}
