export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  icon: 'welcome' | 'ceremony' | 'banquet' | 'cake' | 'dance' | 'photos' | 'sparklers' | 'custom';
}

export interface VenueDetails {
  name: string;
  address: string;
  time: string;
  mapCoords: string; // latitude,longitude or address query
  description?: string;
}

export interface DressCode {
  enabled: boolean;
  description: string;
  colors: string[]; // hex codes
}

export interface Wishlist {
  enabled: boolean;
  description: string;
  items: string[];
}

export interface WeddingConfig {
  husbandName: string;
  wifeName: string;
  date: string; // ISO format string
  introImage: string; // file path or URL
  welcomeText: string;
  schedule: TimelineEvent[];
  registryVenue: VenueDetails;
  banquetVenue: VenueDetails;
  dressCode: DressCode;
  wishlist: Wishlist;
  theme: 'retro' | 'electro' | 'classic' | 'minimal' | 'burgundy';
  musicUrl?: string;
  organizerPhone?: string;
}

export interface RSVPSubmission {
  id: string;
  guestName: string;
  attending: 'yes' | 'no' | 'undecided';
  plusOne?: boolean;
  plusOneName?: string;
  drinks?: string[]; // selected drinks ids
  dietary?: string;
  submittedAt: string;
}

export type ThemeType = 'retro' | 'electro' | 'classic' | 'minimal' | 'burgundy';

export interface ThemeConfig {
  name: string;
  bgClass: string;
  cardBgClass: string;
  textPrimaryClass: string;
  textSecondaryClass: string;
  accentClass: string;
  accentBorderClass: string;
  accentHoverClass: string;
  titleFont: string;
  bodyFont: string;
  glowEffect?: string;
}
