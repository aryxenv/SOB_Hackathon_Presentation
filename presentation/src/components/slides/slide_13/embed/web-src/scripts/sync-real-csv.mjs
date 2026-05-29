import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..', '..');
const SOURCE_DIR = path.join(ROOT, 'data', 'csv');
const OUTPUT_DIR = path.join(ROOT, 'web', 'src', 'assets', 'data');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ',') {
      row.push(cell);
      cell = '';
      continue;
    }
    if (ch === '\n' || (ch === '\r' && next === '\n')) {
      row.push(cell);
      if (row.some((value) => value.trim().length > 0)) {
        rows.push(row.map((value) => value.trim()));
      }
      row = [];
      cell = '';
      if (ch === '\r') i += 1;
      continue;
    }
    if (ch !== '\r') {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (row.some((value) => value.trim().length > 0)) {
      rows.push(row.map((value) => value.trim()));
    }
  }

  return rows;
}

function rowsToObjects(rows) {
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((cells) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = cells[index] ?? '';
    });
    return record;
  });
}

function escapeCsvCell(value) {
  const text = String(value ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function toCsv(headers, rows) {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsvCell(row[header] ?? '')).join(','));
  }
  return `${lines.join('\n')}\n`;
}

function toNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(value ?? '');
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function loadCsv(filename) {
  const content = await fs.readFile(path.join(SOURCE_DIR, filename), 'utf8');
  return rowsToObjects(parseCsv(content));
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const [dimAthlete, dimSport, dimEvent, dimGeography, factParticipation, factResults] = await Promise.all([
    loadCsv('dim_athlete.csv'),
    loadCsv('dim_sport.csv'),
    loadCsv('dim_event.csv'),
    loadCsv('dim_geography.csv'),
    loadCsv('fact_participation.csv'),
    loadCsv('fact_results.csv'),
  ]);

  const sportByKey = new Map(dimSport.map((row) => [row.sport_key, row.sport_name]));
  const geographyByKey = new Map(dimGeography.map((row) => [row.geography_key, row]));

  const participationByAthlete = new Map();
  for (const row of factParticipation) {
    const athleteKey = row.athlete_key;
    const timeKey = toNumber(row.time_key);
    const existing = participationByAthlete.get(athleteKey);
    if (!existing || timeKey > existing.timeKey) {
      participationByAthlete.set(athleteKey, {
        geographyKey: row.geography_key,
        timeKey,
      });
    }
  }

  const sportVotesByAthlete = new Map();
  const geographyByAthleteFromResults = new Map();
  for (const row of factResults) {
    const athleteKey = String(Math.trunc(toNumber(row.athlete_key)));
    if (!athleteKey || athleteKey === '0') continue;
    const sportKey = String(Math.trunc(toNumber(row.sport_key)));
    if (!sportKey || sportKey === '0') continue;
    const tally = sportVotesByAthlete.get(athleteKey) ?? new Map();
    tally.set(sportKey, (tally.get(sportKey) ?? 0) + 1);
    sportVotesByAthlete.set(athleteKey, tally);

    const geographyKey = String(Math.trunc(toNumber(row.geography_key, -1)));
    const timeKey = toNumber(row.time_key);
    const existingGeo = geographyByAthleteFromResults.get(athleteKey);
    const isValidGeo = geographyKey !== '-1' && geographyByKey.has(geographyKey);
    if (isValidGeo && (!existingGeo || timeKey > existingGeo.timeKey)) {
      geographyByAthleteFromResults.set(athleteKey, {
        geographyKey,
        timeKey,
      });
    }
  }

  const preferredEventBySportKey = new Map();
  for (const row of dimEvent) {
    if (!preferredEventBySportKey.has(row.sport_key)) {
      preferredEventBySportKey.set(row.sport_key, row);
    }
  }

  const events = [];
  const sortedSports = [...dimSport].sort((a, b) => Number(a.sport_key) - Number(b.sport_key));
  for (let i = 0; i < sortedSports.length; i++) {
    const sport = sortedSports[i];
    const event = preferredEventBySportKey.get(sport.sport_key);
    const baseName = event?.event_name || sport.sport_name;
    const status = i < 8 ? 'current' : i < 16 ? 'upcoming' : 'past';
    events.push({
      id: `sport-${sport.sport_key}`,
      status,
      date_start: '2025-01-01',
      date_end: '2025-12-31',
      sport: sport.sport_name,
      title_en: baseName,
      title_fr: baseName,
      title_nl: baseName,
      description_en: `${sport.sport_name} competition stream from official Special Olympics data.`,
      description_fr: `Flux de competition ${sport.sport_name} provenant des donnees officielles Special Olympics.`,
      description_nl: `${sport.sport_name}-competitiestream uit officiele Special Olympics-data.`,
      location_en: 'Belgium',
      location_fr: 'Belgique',
      location_nl: 'Belgie',
    });
  }

  const players = [];
  const athleteRows = dimAthlete.filter((row) => row.person_type?.toLowerCase() === 'athlete');
  for (const row of athleteRows) {
    const athleteKey = row.athlete_key;
    const code = row.code || `ATH-${athleteKey}`;
    const sportVotes = sportVotesByAthlete.get(athleteKey);
    let selectedSportKey = '';

    if (sportVotes && sportVotes.size > 0) {
      let top = -1;
      for (const [sportKey, count] of sportVotes.entries()) {
        if (count > top) {
          top = count;
          selectedSportKey = sportKey;
        }
      }
    }

    if (!selectedSportKey) {
      selectedSportKey = String(((Number.parseInt(athleteKey, 10) || 1) % sortedSports.length) + 1);
    }

    const sportName = sportByKey.get(selectedSportKey) ?? 'Special Olympics';
    const participation = participationByAthlete.get(athleteKey);
    const resultGeo = geographyByAthleteFromResults.get(athleteKey);
    const bestGeographyKey =
      participation?.geographyKey && participation.geographyKey !== '-1'
        ? participation.geographyKey
        : (resultGeo?.geographyKey ?? '-1');
    const geo = geographyByKey.get(bestGeographyKey);
    const team = geo?.club_name || geo?.city || 'Special Olympics Belgium';
    const region = geo?.province || geo?.country || 'Belgium';
    const age = row.age ? Number.parseInt(row.age, 10) : null;
    const gender = row.gender === 'F' ? 'female' : row.gender === 'M' ? 'male' : 'athlete';
    const displayCode = code.slice(0, 8);
    const latestYear = participation?.timeKey || '';

    players.push({
      id: `ath-${athleteKey}`,
      event_id: `sport-${selectedSportKey}`,
      name: `Athlete ${displayCode}`,
      sport: sportName,
      team,
      region_en: region,
      region_fr: region,
      region_nl: region,
      bio_en: age
        ? `${gender[0].toUpperCase()}${gender.slice(1)} athlete, age ${age}, active in ${sportName}${latestYear ? ` (${latestYear})` : ''}.`
        : `${gender[0].toUpperCase()}${gender.slice(1)} athlete active in ${sportName}${latestYear ? ` (${latestYear})` : ''}.`,
      bio_fr: age
        ? `Athlete ${gender}, ${age} ans, actif en ${sportName}${latestYear ? ` (${latestYear})` : ''}.`
        : `Athlete ${gender} actif en ${sportName}${latestYear ? ` (${latestYear})` : ''}.`,
      bio_nl: age
        ? `${gender[0].toUpperCase()}${gender.slice(1)} atleet, ${age} jaar, actief in ${sportName}${latestYear ? ` (${latestYear})` : ''}.`
        : `${gender[0].toUpperCase()}${gender.slice(1)} atleet actief in ${sportName}${latestYear ? ` (${latestYear})` : ''}.`,
      _activityYear: latestYear || 0,
    });
  }

  players.sort((a, b) => Number(b._activityYear) - Number(a._activityYear));
  const playerRows = players.slice(0, 7000).map(({ _activityYear, ...rest }) => rest);

  const eventCsv = toCsv(
    [
      'id',
      'status',
      'date_start',
      'date_end',
      'sport',
      'title_en',
      'title_fr',
      'title_nl',
      'description_en',
      'description_fr',
      'description_nl',
      'location_en',
      'location_fr',
      'location_nl',
    ],
    events,
  );

  const playerCsv = toCsv(
    ['id', 'event_id', 'name', 'sport', 'team', 'region_en', 'region_fr', 'region_nl', 'bio_en', 'bio_fr', 'bio_nl'],
    playerRows,
  );

  await Promise.all([
    fs.writeFile(path.join(OUTPUT_DIR, 'events.csv'), eventCsv, 'utf8'),
    fs.writeFile(path.join(OUTPUT_DIR, 'players.csv'), playerCsv, 'utf8'),
  ]);

  console.log(`Synced real data: ${events.length} events, ${playerRows.length} athletes.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
