import type { Locale } from '../types';

export const DONOR_REGIONS = ['flanders', 'brussels', 'wallonia'] as const;
export type DonorRegion = (typeof DONOR_REGIONS)[number];

const regionLabels: Record<DonorRegion, Record<Locale, string>> = {
  flanders: { en: 'Flanders', fr: 'Flandre', nl: 'Vlaanderen' },
  brussels: { en: 'Brussels', fr: 'Bruxelles', nl: 'Brussel' },
  wallonia: { en: 'Wallonia', fr: 'Wallonie', nl: 'Wallonië' },
};

export function regionLabel(region: DonorRegion, locale: Locale): string {
  return regionLabels[region][locale];
}
