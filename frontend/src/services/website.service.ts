import api from './api';

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

export interface GuestLookupResult {
  guestId: string;
  displayName: string;
  qrPassCode: string;
  token: string;
  inviteUrl: string;
}

export const websiteService = {
  async getPublicWebsite(slug: string): Promise<PublicWebsiteData> {
    const res: any = await api.get(`/public/weddings/${slug}`);
    return res?.data ?? res;
  },

  async lookupGuestPass(slug: string, query: string): Promise<GuestLookupResult> {
    const res: any = await api.post(`/public/weddings/${slug}/lookup-pass`, { query });
    return res?.data ?? res;
  },

  async submitBlessing(
    slug: string,
    payload: { authorName: string; side?: string; message: string }
  ): Promise<WeddingBlessingItem> {
    const res: any = await api.post(`/public/weddings/${slug}/blessings`, payload);
    return res?.data ?? res;
  },
};
