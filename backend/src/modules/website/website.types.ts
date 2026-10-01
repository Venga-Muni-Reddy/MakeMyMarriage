export interface LoveStoryMilestone {
  step: number;
  title: string;
  date: string;
  description: string;
  photoUrl?: string;
}

export interface PublicCeremonyItem {
  id: string;
  name: string;
  type: string;
  startAt: string;
  endAt?: string;
  venueName: string;
  venueAddress: string;
  dressCode: string;
  dressCodeColor?: string;
  isMandap: boolean;
  googleMapsUrl?: string;
}

export interface TravelConciergeGuide {
  airport: string;
  airportDistance: string;
  shuttleDetails: string;
  palaceTransfers: string;
  accommodationsNote: string;
  weatherAdvisory: string;
  conciergeWhatsApp?: string;
}

export interface WeddingBlessingItem {
  id: string;
  authorName: string;
  side: string;
  message: string;
  createdAt: string;
}

export interface PublicWebsiteData {
  weddingId: string;
  name: string;
  slug: string;
  brideName: string;
  groomName: string;
  monogram: string;
  weddingDate: string | null;
  displayDate: string;
  primaryVenueName: string;
  primaryVenueCity: string;
  sanskritShloka: {
    verse: string;
    translation: string;
  };
  soundscape: {
    name: string;
    audioUrl: string;
  } | null;
  loveStory: LoveStoryMilestone[];
  events: PublicCeremonyItem[];
  travelConcierge: TravelConciergeGuide;
  blessings: WeddingBlessingItem[];
}

export interface LookupGuestPassInput {
  query: string;
}

export interface AddBlessingInput {
  authorName: string;
  side?: string;
  message: string;
}
