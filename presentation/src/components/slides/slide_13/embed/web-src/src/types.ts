export type Locale = 'en' | 'fr' | 'nl';

export type EventStatus = 'current' | 'upcoming' | 'past';

export interface Event {
  id: string;
  status: EventStatus;
  dateStart: string;
  dateEnd: string;
  sport: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  location: Record<Locale, string>;
}

export interface Player {
  id: string;
  eventId: string;
  name: string;
  sport: string;
  team: string;
  region: Record<Locale, string>;
  bio: Record<Locale, string>;
}

export type ResultMedal = 'gold' | 'silver' | 'bronze' | 'none';
export type ResultStatus = 'live' | 'final';

export interface EventResult {
  id: string;
  eventId: string;
  playerId: string;
  sport: string;
  athleteName: string;
  team: string;
  discipline: Record<Locale, string>;
  resultValue: string;
  resultUnit: string;
  rank: number;
  medal: ResultMedal;
  status: ResultStatus;
}

export interface DonationTier {
  amount: number;
  labelKey: string;
}
