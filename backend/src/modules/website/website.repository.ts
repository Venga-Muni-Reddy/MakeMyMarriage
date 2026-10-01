import prisma from '../../infrastructure/prisma/client';
import {
  PublicWebsiteData,
  PublicCeremonyItem,
  LoveStoryMilestone,
  TravelConciergeGuide,
  WeddingBlessingItem,
  AddBlessingInput,
} from './website.types';

const DEFAULT_SHLOKA = {
  verse: '॥ मांगल्यं तन्तुनानेन लोकजीवनहेतुना । कण्ठे बध्नामि सुभगे सञ्जीव शरदः शतम् ॥',
  translation: 'This sacred thread, auspicious and the cause of my life, I tie around your neck. May you live happily with me for a hundred autumns.',
};

const DEFAULT_LOVE_STORY: LoveStoryMilestone[] = [
  {
    step: 1,
    title: 'The First Encounter',
    date: 'Autumn 2021',
    description: 'A serendipitous meeting at the university library during the golden hour of Delhi autumn.',
  },
  {
    step: 2,
    title: 'The Proposal by Lake Pichola',
    date: 'Winter 2025',
    description: 'Under a canopy of lanterns and Udaipur stars, Rahul asked the eternal question beside the placid waters of Lake Pichola.',
  },
  {
    step: 3,
    title: 'The Auspicious Roka',
    date: 'Spring 2026',
    description: 'Surrounded by the elders and royal blessings, both families united in joyous celebration and prayer.',
  },
  {
    step: 4,
    title: 'Shubh Vivah',
    date: 'December 2026',
    description: 'The sacred Seven Vows around the Agni Kund under the heritage marble mandap of Jagmandir Island.',
  },
];

const DEFAULT_TRAVEL_GUIDE: TravelConciergeGuide = {
  airport: 'Maharana Pratap Airport Udaipur (UDR)',
  airportDistance: '40 minutes scenic chauffeur drive to City Palace complex',
  shuttleDetails: 'Dedicated royal fleet shuttles running hourly from airport arrivals terminal',
  palaceTransfers: 'Exclusive heritage motorboats operating continuously from Bansi Ghat Jetty',
  accommodationsNote: 'Deluxe Heritage Suites reserved in the Palace Royal Guest Wing',
  weatherAdvisory: 'Pleasant daytime winter sun (24°C) with brisk regal palace evenings (12°C). Light woollens/shawls recommended.',
  conciergeWhatsApp: '+91 98765 43210',
};

const CEREMONY_DRESS_CODES: Record<string, { dressCode: string; color: string }> = {
  mehendi: { dressCode: 'Festive Citrus & Mint Green', color: 'bg-emerald-100 text-emerald-800' },
  sangeet: { dressCode: 'Royal Ethnic Glam & Velvet', color: 'bg-purple-100 text-purple-800' },
  haldi: { dressCode: 'Marigold Yellow & Crisp White', color: 'bg-amber-100 text-amber-800' },
  muhurtham: { dressCode: 'Heritage Traditional Silks', color: 'bg-rose-100 text-rose-800' },
  vivaha: { dressCode: 'Heritage Traditional Silks', color: 'bg-rose-100 text-rose-800' },
  reception: { dressCode: 'Black Tie & Imperial Sherwanis', color: 'bg-stone-800 text-stone-100' },
};

export class WebsiteRepository {
  async getPublicWebsiteBySlug(slug: string): Promise<PublicWebsiteData | null> {
    const wedding = await prisma.wedding.findFirst({
      where: {
        slug: { equals: slug.toLowerCase().trim(), mode: 'insensitive' },
        deletedAt: null,
      },
      include: {
        venues: { where: { deletedAt: null } },
        events: {
          where: { deletedAt: null },
          orderBy: { startAt: 'asc' },
          include: { venue: true },
        },
        website: {
          include: {
            sections: { where: { isEnabled: true }, orderBy: { position: 'asc' } },
          },
        },
      },
    });

    if (!wedding) return null;

    const settings = (wedding.settings as Record<string, any>) || {};
    const websiteSettings = (wedding.website?.settings as Record<string, any>) || {};

    // 1. Couple Names & Monogram
    const brideName = settings.partner1Name || 'Ananya Sharma';
    const groomName = settings.partner2Name || 'Rahul Singhania';
    const brideFirst = brideName.split(' ')[0] || 'A';
    const groomFirst = groomName.split(' ')[0] || 'R';
    const monogram = `${brideFirst[0]} & ${groomFirst[0]}`;

    // 2. Venues & Dates
    const primaryVenue = wedding.venues[0];
    const primaryVenueName = primaryVenue?.name || settings.primaryVenueName || 'City Palace & Jagmandir Island';
    const primaryVenueCity = primaryVenue?.city || 'Udaipur, Rajasthan';
    const displayDate = settings.displayDate || 'December 18–20, 2026';

    // 3. Events Itinerary
    const events: PublicCeremonyItem[] = wedding.events.map((ev: any) => {
      const lowerName = ev.name.toLowerCase();
      let dressCode = 'Festive Indian Ethnic';
      let dressCodeColor = 'bg-amber-100 text-amber-800';

      for (const [key, val] of Object.entries(CEREMONY_DRESS_CODES)) {
        if (lowerName.includes(key)) {
          dressCode = val.dressCode;
          dressCodeColor = val.color;
          break;
        }
      }

      const isMandap =
        lowerName.includes('vivah') ||
        lowerName.includes('muhurtham') ||
        lowerName.includes('pher') ||
        lowerName.includes('mandap');

      const address = ev.venue?.addressLine1
        ? `${ev.venue.addressLine1}, ${primaryVenueCity}`
        : `${ev.venue?.name || primaryVenueName}, ${primaryVenueCity}`;

      return {
        id: ev.id,
        name: ev.name,
        type: (ev.settings as any)?.eventType || 'CEREMONY',
        startAt: ev.startAt.toISOString(),
        endAt: ev.endAt?.toISOString(),
        venueName: ev.venue?.name || primaryVenueName,
        venueAddress: address,
        dressCode,
        dressCodeColor,
        isMandap,
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
      };
    });

    // 4. Blessings Compilation (from settings + guest messages)
    const storedBlessings: WeddingBlessingItem[] = Array.isArray(settings.blessings) ? settings.blessings : [];

    // Also pull blessing messages from guests who submitted during RSVP
    const guestBlessings = await prisma.guest.findMany({
      where: {
        weddingId: wedding.id,
        deletedAt: null,
      },
      select: {
        id: true,
        displayName: true,
        side: true,
        metadata: true,
        updatedAt: true,
      },
      take: 12,
      orderBy: { updatedAt: 'desc' },
    });

    const combinedBlessings: WeddingBlessingItem[] = [...storedBlessings];
    for (const g of guestBlessings) {
      const meta = (g.metadata as Record<string, any>) || {};
      if (meta.blessingMessage && typeof meta.blessingMessage === 'string' && meta.blessingMessage.trim().length > 0) {
        if (!combinedBlessings.some((b) => b.message === meta.blessingMessage)) {
          combinedBlessings.push({
            id: `guest_${g.id}`,
            authorName: g.displayName,
            side: g.side,
            message: meta.blessingMessage,
            createdAt: meta.respondedAt || g.updatedAt.toISOString(),
          });
        }
      }
    }

    // Default sample blessings if none exists yet
    if (combinedBlessings.length === 0) {
      combinedBlessings.push(
        {
          id: 'b1',
          authorName: 'Yuvraj Vikramaditya & Family',
          side: 'GROOM',
          message: 'May the sacred union of Ananya and Rahul be showered with the grace of Mahadev. Heartiest congratulations!',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'b2',
          authorName: 'Rajkumari Gayatri Devi',
          side: 'BRIDE',
          message: 'Wishing our radiant bride Ananya and dear Rahul an eternity of laughter, honor, and deep love.',
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        }
      );
    }

    return {
      weddingId: wedding.id,
      name: wedding.name,
      slug: wedding.slug,
      brideName,
      groomName,
      monogram,
      weddingDate: wedding.weddingDate ? wedding.weddingDate.toISOString() : null,
      displayDate,
      primaryVenueName,
      primaryVenueCity,
      sanskritShloka: settings.sanskritShloka || DEFAULT_SHLOKA,
      soundscape: {
        name: 'Auspicious Shehnai & Classical Sitar',
        audioUrl: 'https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3',
      },
      loveStory: Array.isArray(settings.loveStory) && settings.loveStory.length > 0 ? settings.loveStory : DEFAULT_LOVE_STORY,
      events,
      travelConcierge: settings.travelConcierge || DEFAULT_TRAVEL_GUIDE,
      blessings: combinedBlessings,
    };
  }

  async lookupGuestPass(slug: string, query: string) {
    const wedding = await prisma.wedding.findFirst({
      where: {
        slug: { equals: slug.toLowerCase().trim(), mode: 'insensitive' },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!wedding) return null;

    const cleanQuery = query.trim();
    const cleanLower = cleanQuery.toLowerCase();
    const queryDigits = cleanQuery.replace(/\D/g, '');

    const guests = await prisma.guest.findMany({
      where: {
        weddingId: wedding.id,
        deletedAt: null,
      },
      include: {
        invitations: {
          include: { access: true },
        },
      },
    });

    let matchedGuest: any = null;
    for (const g of guests) {
      const meta = (g.metadata as Record<string, any>) || {};
      const passCode = (meta.qrPassCode || '').toLowerCase();
      const magicTok = (meta.magicToken || '').toLowerCase();
      const cleanPhone = (g.phone || '').replace(/\D/g, '');
      const dispName = (g.displayName || '').toLowerCase();
      const email = (g.email || '').toLowerCase();

      if (
        (passCode && (passCode === cleanLower || passCode.includes(cleanLower))) ||
        (magicTok && (magicTok === cleanLower || magicTok.includes(cleanLower))) ||
        (queryDigits.length >= 4 && cleanPhone.endsWith(queryDigits)) ||
        (dispName && dispName.includes(cleanLower)) ||
        (email && email.includes(cleanLower))
      ) {
        matchedGuest = g;
        break;
      }
    }

    if (!matchedGuest) return null;

    const meta = (matchedGuest.metadata as Record<string, any>) || {};
    const passCode = meta.qrPassCode || matchedGuest.invitations?.[0]?.access?.tokenHash || cleanQuery.toUpperCase();
    const token = meta.magicToken || passCode;

    return {
      guestId: matchedGuest.id,
      displayName: matchedGuest.displayName,
      qrPassCode: passCode,
      token,
      inviteUrl: `/invite/${token}`,
    };
  }

  async addBlessing(slug: string, input: AddBlessingInput) {
    const wedding = await prisma.wedding.findFirst({
      where: {
        slug: { equals: slug.toLowerCase().trim(), mode: 'insensitive' },
        deletedAt: null,
      },
    });

    if (!wedding) return null;

    const settings = (wedding.settings as Record<string, any>) || {};
    const existingBlessings: WeddingBlessingItem[] = Array.isArray(settings.blessings) ? settings.blessings : [];

    const newBlessing: WeddingBlessingItem = {
      id: `bless_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      authorName: input.authorName.trim(),
      side: input.side || 'NEUTRAL',
      message: input.message.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedBlessings = [newBlessing, ...existingBlessings];

    await prisma.wedding.update({
      where: { id: wedding.id },
      data: {
        settings: {
          ...settings,
          blessings: updatedBlessings as any,
        },
      },
    });

    return newBlessing;
  }
}

export const websiteRepository = new WebsiteRepository();
