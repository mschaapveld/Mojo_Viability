export type AustralianState = 'NSW' | 'VIC' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'ACT' | 'NT';

export interface LiquorLicenceOption {
  value: string;
  label: string;
  isUniversal?: boolean;
}

export const LIQUOR_LICENCES_BY_STATE: Record<AustralianState, LiquorLicenceOption[]> = {
  NSW: [
    { value: 'on-premises', label: 'On-premises licence (restaurant / catering style)' },
    { value: 'small-bar', label: 'Small bar licence' },
    { value: 'hotel', label: 'Hotel licence (includes general bar style venues)' },
    { value: 'club', label: 'Club licence' },
    { value: 'packaged-liquor', label: 'Packaged liquor licence (takeaway / bottle shop)' },
    { value: 'producer-wholesaler', label: 'Producer / wholesaler licence' },
    { value: 'limited', label: 'Limited licence (special event / function style)' },
  ],
  VIC: [
    { value: 'on-premises', label: 'On-premises licence (restaurants / cafes / bars / nightclubs)' },
    { value: 'general', label: 'General licence (pubs / hotels / taverns; can include on and off supply)' },
    { value: 'packaged-liquor', label: 'Packaged liquor licence (bottle shop / takeaway)' },
    { value: 'club', label: 'Club licence' },
    { value: 'renewable-limited', label: 'Renewable limited licence' },
    { value: 'byo-permit', label: 'BYO permit' },
  ],
  QLD: [
    { value: 'commercial-hotel', label: 'Commercial hotel licence' },
    { value: 'commercial-other', label: 'Commercial other licence (subsidiary on-premises; e.g. restaurant/cafe/function)' },
    { value: 'community-club', label: 'Community club licence' },
    { value: 'industrial-canteen', label: 'Industrial canteen licence' },
    { value: 'producer-wholesaler', label: 'Producer / wholesaler licence' },
    { value: 'permit-event', label: 'Permit / event-based authorisation (short term or special event)' },
  ],
  SA: [
    { value: 'restaurant-catering', label: 'Restaurant and catering licence' },
    { value: 'small-venue', label: 'Small venue licence' },
    { value: 'general-hotel', label: 'General and hotel licence' },
    { value: 'club', label: 'Club licence' },
    { value: 'packaged-liquor', label: 'Packaged liquor sales licence' },
    { value: 'liquor-production', label: 'Liquor production and sales licence' },
    { value: 'short-term', label: 'Short term liquor licence (events)' },
  ],
  WA: [
    { value: 'small-bar', label: 'Small bar licence' },
    { value: 'restaurant', label: 'Restaurant licence' },
    { value: 'hotel', label: 'Hotel licence (and hotel restricted where applicable)' },
    { value: 'tavern', label: 'Tavern licence (and tavern restricted where applicable)' },
    { value: 'club', label: 'Club / club restricted licence' },
    { value: 'liquor-store', label: 'Liquor store licence' },
    { value: 'nightclub', label: 'Nightclub licence' },
    { value: 'producer', label: 'Producer licence' },
    { value: 'special-facility', label: 'Special facility licence' },
    { value: 'wholesaler', label: 'Wholesaler licence' },
  ],
  TAS: [
    { value: 'general', label: 'General licence' },
    { value: 'on-licence', label: 'On-licence' },
    { value: 'off-licence', label: 'Off-licence' },
    { value: 'club', label: 'Club licence' },
    { value: 'special', label: 'Special licence' },
  ],
  ACT: [
    { value: 'on-licence', label: 'On licence' },
    { value: 'general', label: 'General licence' },
    { value: 'club', label: 'Club licence' },
    { value: 'off-licence', label: 'Off licence' },
    { value: 'special', label: 'Special licence (events)' },
  ],
  NT: [
    { value: 'restaurant', label: 'Restaurant authority' },
    { value: 'restaurant-bar', label: 'Restaurant bar authority' },
    { value: 'small-bar', label: 'Small bar authority' },
    { value: 'public-bar', label: 'Public bar authority' },
    { value: 'club', label: 'Club authority' },
    { value: 'community-club', label: 'Community club authority' },
    { value: 'late-night', label: 'Late night authority / extended late night authority' },
  ],
};

export const UNIVERSAL_LICENCE_OPTIONS: LiquorLicenceOption[] = [
  { value: 'not-sure', label: 'Not sure yet', isUniversal: true },
  { value: 'other', label: 'Other (type it in)', isUniversal: true },
];

export function getLiquorLicencesForState(state: AustralianState | null): LiquorLicenceOption[] {
  if (!state) {
    return UNIVERSAL_LICENCE_OPTIONS;
  }

  const stateLicences = LIQUOR_LICENCES_BY_STATE[state] || [];
  return [...stateLicences, ...UNIVERSAL_LICENCE_OPTIONS];
}

export function extractStateFromAddress(address: string | null | undefined): AustralianState | null {
  if (!address) return null;

  const statePatterns: Record<AustralianState, RegExp> = {
    NSW: /\bNSW\b/i,
    VIC: /\bVIC\b/i,
    QLD: /\bQLD\b/i,
    SA: /\bSA\b/i,
    WA: /\bWA\b/i,
    TAS: /\bTAS\b/i,
    ACT: /\bACT\b/i,
    NT: /\bNT\b/i,
  };

  for (const [state, pattern] of Object.entries(statePatterns)) {
    if (pattern.test(address)) {
      return state as AustralianState;
    }
  }

  return null;
}
