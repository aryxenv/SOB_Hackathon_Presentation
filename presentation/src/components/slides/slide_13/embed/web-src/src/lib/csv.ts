import type { Event, EventStatus, EventResult, Locale, Player } from '../types';

const EVENTS_CSV_URL = new URL('../assets/data/events.csv', import.meta.url).href;
const PLAYERS_CSV_URL = new URL('../assets/data/players.csv', import.meta.url).href;
const RESULTS_CSV_URL = new URL('../assets/data/results.csv', import.meta.url).href;

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell.trim());
      cell = '';
    } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
      row.push(cell.trim());
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      cell = '';
      if (ch === '\r') i++;
    } else if (ch !== '\r') {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    if (row.some((c) => c.length > 0)) rows.push(row);
  }

  return rows;
}

function rowsToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((cells) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = cells[i] ?? '';
    });
    return obj;
  });
}

function localized(row: Record<string, string>, field: string): Record<Locale, string> {
  return {
    en: row[`${field}_en`] ?? '',
    fr: row[`${field}_fr`] ?? '',
    nl: row[`${field}_nl`] ?? '',
  };
}

export async function loadEvents(): Promise<Event[]> {
  const res = await fetch(EVENTS_CSV_URL);
  const text = await res.text();
  const rows = rowsToObjects(parseCsv(text));

  return rows.map((row) => ({
    id: row.id,
    status: row.status as EventStatus,
    dateStart: row.date_start,
    dateEnd: row.date_end,
    sport: row.sport,
    title: localized(row, 'title'),
    description: localized(row, 'description'),
    location: localized(row, 'location'),
  }));
}

export async function loadPlayers(): Promise<Player[]> {
  const res = await fetch(PLAYERS_CSV_URL);
  const text = await res.text();
  const rows = rowsToObjects(parseCsv(text));

  return rows.map((row) => ({
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    sport: row.sport,
    team: row.team,
    region: localized(row, 'region'),
    bio: localized(row, 'bio'),
  }));
}

export async function loadResults(): Promise<EventResult[]> {
  const res = await fetch(RESULTS_CSV_URL);
  const text = await res.text();
  const rows = rowsToObjects(parseCsv(text));

  return rows.map((row) => ({
    id: row.id,
    eventId: row.event_id,
    playerId: row.player_id ?? '',
    sport: row.sport,
    athleteName: row.athlete_name,
    team: row.team,
    discipline: localized(row, 'discipline'),
    resultValue: row.result_value,
    resultUnit: row.result_unit,
    rank: Number.parseInt(row.rank, 10) || 0,
    medal: (row.medal || 'none') as EventResult['medal'],
    status: (row.status || 'final') as EventResult['status'],
  }));
}
