import prisma from '../../infrastructure/prisma/client';
import { CreateGuestDTO, UpdateGuestDTO, GuestQueryFilters, GuestTelemetry } from './guest.types';

export const guestRepository = {
  async findMany(weddingId: string, filters: GuestQueryFilters) {
    const { page = 1, limit = 50, search, side, categoryId, rsvpStatus, eventId, sortBy = 'createdAt', sortOrder = 'desc' } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      weddingId,
      deletedAt: filters.isArchived ? { not: null } : null,
    };

    if (side && side !== 'ALL') {
      where.side = side;
    }

    if (categoryId && categoryId !== 'ALL') {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (eventId && eventId !== 'ALL') {
      where.guestEvents = {
        some: {
          eventId,
          accessStatus: 'ALLOWED',
        },
      };
    }

    const [items, total] = await Promise.all([
      prisma.guest.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          category: true,
          guestEvents: {
            include: {
              event: {
                select: {
                  id: true,
                  name: true,
                  startAt: true,
                  settings: true,
                },
              },
            },
          },
        },
      }),
      prisma.guest.count({ where }),
    ]);

    // Client-side / in-memory filter for rsvpStatus if stored inside metadata JSON
    let filteredItems = items;
    if (rsvpStatus && rsvpStatus !== 'ALL') {
      filteredItems = items.filter((g: any) => {
        const status = g.metadata?.rsvpStatus || 'AWAITING';
        return status === rsvpStatus;
      });
    }

    return {
      items: filteredItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async findById(weddingId: string, guestId: string) {
    return prisma.guest.findFirst({
      where: {
        id: guestId,
        weddingId,
        deletedAt: null,
      },
      include: {
        category: true,
        guestEvents: {
          include: {
            event: true,
          },
        },
      },
    });
  },

  async create(weddingId: string, data: CreateGuestDTO) {
    const displayName = data.displayName || `${data.honorific ? data.honorific + ' ' : ''}${data.firstName}${data.lastName ? ' ' + data.lastName : ''}`.trim();
    
    // Check or create category if categoryName is provided
    let categoryId = data.categoryId;
    if (!categoryId && data.categoryName) {
      const cat = await this.findOrCreateCategory(weddingId, data.categoryName);
      categoryId = cat.id;
    }

    const metadata: any = {
      ...(data.metadata || {}),
      honorific: data.honorific || 'Shri',
      householdName: data.householdName || `${data.lastName || data.firstName} Household`,
      householdRole: data.householdRole || 'HEAD',
      paxCount: data.paxCount || 1,
      companions: data.companions || [],
      dietary: data.dietary || 'PURE_VEG',
      dietaryLabel: data.dietaryLabel || 'Pure Vegetarian',
      allergies: data.allergies || '',
      city: data.city || '',
      allocatedSuite: data.allocatedSuite || '',
      rsvpStatus: data.rsvpStatus || 'AWAITING',
      rsvpPax: data.rsvpStatus === 'ATTENDING' ? (data.paxCount || 1) : 0,
      qrPassCode: `MMM-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    };

    const guest = await prisma.guest.create({
      data: {
        weddingId,
        categoryId: categoryId || null,
        firstName: data.firstName,
        lastName: data.lastName || null,
        displayName,
        email: data.email || null,
        phone: data.phone || null,
        side: data.side as any || 'NEUTRAL',
        notes: data.notes || null,
        metadata,
      },
      include: {
        category: true,
      },
    });

    // If eventIds are provided, create GuestEvent relationships
    if (data.eventIds && data.eventIds.length > 0) {
      await prisma.guestEvent.createMany({
        data: data.eventIds.map((eventId) => ({
          guestId: guest.id,
          eventId,
          invitationStatus: 'INVITED',
          accessStatus: 'ALLOWED',
        })),
        skipDuplicates: true,
      });
    }

    return this.findById(weddingId, guest.id);
  },

  async update(weddingId: string, guestId: string, data: UpdateGuestDTO) {
    const existing = await this.findById(weddingId, guestId);
    if (!existing) return null;

    const currentMeta = (existing.metadata as Record<string, any>) || {};
    const updatedMeta: any = {
      ...currentMeta,
      ...(data.metadata || {}),
    };

    if (data.honorific !== undefined) updatedMeta.honorific = data.honorific;
    if (data.householdName !== undefined) updatedMeta.householdName = data.householdName;
    if (data.householdRole !== undefined) updatedMeta.householdRole = data.householdRole;
    if (data.paxCount !== undefined) updatedMeta.paxCount = data.paxCount;
    if (data.companions !== undefined) updatedMeta.companions = data.companions;
    if (data.dietary !== undefined) updatedMeta.dietary = data.dietary;
    if (data.dietaryLabel !== undefined) updatedMeta.dietaryLabel = data.dietaryLabel;
    if (data.allergies !== undefined) updatedMeta.allergies = data.allergies;
    if (data.city !== undefined) updatedMeta.city = data.city;
    if (data.allocatedSuite !== undefined) updatedMeta.allocatedSuite = data.allocatedSuite;
    if (data.rsvpStatus !== undefined) {
      updatedMeta.rsvpStatus = data.rsvpStatus;
      updatedMeta.rsvpPax = data.rsvpStatus === 'ATTENDING' ? (updatedMeta.paxCount || 1) : 0;
    }

    let displayName = data.displayName;
    if (!displayName && (data.firstName || data.lastName || data.honorific)) {
      const h = updatedMeta.honorific ? updatedMeta.honorific + ' ' : '';
      const fn = data.firstName !== undefined ? data.firstName : existing.firstName;
      const ln = data.lastName !== undefined ? (data.lastName ? ' ' + data.lastName : '') : (existing.lastName ? ' ' + existing.lastName : '');
      displayName = `${h}${fn}${ln}`.trim();
    }

    await prisma.guest.update({
      where: { id: guestId },
      data: {
        firstName: data.firstName !== undefined ? data.firstName : existing.firstName,
        lastName: data.lastName !== undefined ? data.lastName : existing.lastName,
        displayName: displayName || existing.displayName,
        email: data.email !== undefined ? data.email : existing.email,
        phone: data.phone !== undefined ? data.phone : existing.phone,
        side: data.side !== undefined ? (data.side as any) : existing.side,
        categoryId: data.categoryId !== undefined ? data.categoryId : existing.categoryId,
        notes: data.notes !== undefined ? data.notes : existing.notes,
        metadata: updatedMeta,
      },
    });

    // If eventIds specified, sync GuestEvent relationships
    if (data.eventIds !== undefined) {
      await prisma.guestEvent.deleteMany({
        where: { guestId },
      });
      if (data.eventIds.length > 0) {
        await prisma.guestEvent.createMany({
          data: data.eventIds.map((eventId) => ({
            guestId,
            eventId,
            invitationStatus: 'INVITED',
            accessStatus: 'ALLOWED',
          })),
          skipDuplicates: true,
        });
      }
    }

    return this.findById(weddingId, guestId);
  },

  async delete(weddingId: string, guestId: string) {
    const existing = await prisma.guest.findFirst({
      where: { id: guestId, weddingId },
    });
    if (!existing) return false;

    await prisma.guest.update({
      where: { id: guestId },
      data: { deletedAt: new Date() },
    });
    return true;
  },

  async unarchive(weddingId: string, guestId: string) {
    const existing = await prisma.guest.findFirst({
      where: { id: guestId, weddingId },
    });
    if (!existing) return false;

    await prisma.guest.update({
      where: { id: guestId },
      data: { deletedAt: null },
    });
    return true;
  },

  async bulkAssignCeremony(weddingId: string, guestIds: string[], eventId: string) {
    const guests = await prisma.guest.findMany({
      where: { id: { in: guestIds }, weddingId },
      select: { id: true },
    });
    const validGuestIds = guests.map((g: any) => g.id);

    await prisma.guestEvent.createMany({
      data: validGuestIds.map((guestId: string) => ({
        guestId,
        eventId,
        invitationStatus: 'INVITED',
        accessStatus: 'ALLOWED',
      })),
      skipDuplicates: true,
    });

    return validGuestIds.length;
  },

  async bulkUpdateDietary(weddingId: string, guestIds: string[], dietary: string, dietaryLabel?: string) {
    const guests = await prisma.guest.findMany({
      where: { id: { in: guestIds }, weddingId },
    });

    for (const guest of guests) {
      const meta = (guest.metadata as Record<string, any>) || {};
      meta.dietary = dietary;
      if (dietaryLabel) meta.dietaryLabel = dietaryLabel;
      await prisma.guest.update({
        where: { id: guest.id },
        data: { metadata: meta },
      });
    }

    return guests.length;
  },

  async bulkArchive(weddingId: string, guestIds: string[]) {
    const res = await prisma.guest.updateMany({
      where: {
        id: { in: guestIds },
        weddingId,
      },
      data: { deletedAt: new Date() },
    });
    return res.count;
  },

  async bulkUnarchive(weddingId: string, guestIds: string[]) {
    const res = await prisma.guest.updateMany({
      where: {
        id: { in: guestIds },
        weddingId,
      },
      data: { deletedAt: null },
    });
    return res.count;
  },

  async findCategories(weddingId: string) {
    let categories = await prisma.guestCategory.findMany({
      where: { weddingId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { guests: true },
        },
      },
    });

    if (categories.length === 0) {
      await this.seedDefaultCategories(weddingId);
      categories = await prisma.guestCategory.findMany({
        where: { weddingId },
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { guests: true },
          },
        },
      });
    }

    return categories;
  },

  async createCategory(weddingId: string, name: string) {
    return prisma.guestCategory.create({
      data: { weddingId, name },
    });
  },

  async findOrCreateCategory(weddingId: string, name: string) {
    const existing = await prisma.guestCategory.findFirst({
      where: { weddingId, name },
    });
    if (existing) return existing;
    return prisma.guestCategory.create({
      data: { weddingId, name },
    });
  },

  async seedDefaultCategories(weddingId: string) {
    const defaultCategories = [
      '👑 Royal Family (VIP)',
      '🪷 Immediate Kin',
      '🥂 Close Friends & Inner Circle',
      '🏛️ Corporate & Dignitaries',
    ];

    for (const name of defaultCategories) {
      await prisma.guestCategory.upsert({
        where: { weddingId_name: { weddingId, name } },
        update: {},
        create: { weddingId, name },
      });
    }
  },

  async calculateTelemetry(weddingId: string): Promise<GuestTelemetry> {
    const guests = await prisma.guest.findMany({
      where: { weddingId, deletedAt: null },
      include: {
        guestEvents: {
          include: {
            event: {
              select: { name: true, settings: true },
            },
          },
        },
      },
    });

    let totalPax = 0;
    let confirmedAttending = 0;
    let awaitingResponse = 0;
    let regretfullyDeclined = 0;

    let pureVeg = 0;
    let jainSaatvik = 0;
    let nonVeg = 0;
    let allergies = 0;

    let mandapCount = 0;
    let haldiCount = 0;
    let receptionCount = 0;

    for (const g of guests) {
      const meta = (g.metadata as Record<string, any>) || {};
      const pax = Number(meta.paxCount) || 1;
      totalPax += pax;

      const rsvp = meta.rsvpStatus || 'AWAITING';
      if (rsvp === 'ATTENDING') confirmedAttending += pax;
      else if (rsvp === 'DECLINED') regretfullyDeclined += pax;
      else awaitingResponse += pax;

      const diet = meta.dietary || 'PURE_VEG';
      if (diet === 'JAIN') jainSaatvik += pax;
      else if (diet === 'NON_VEG') nonVeg += pax;
      else pureVeg += pax;

      if (meta.allergies && meta.allergies.trim()) allergies += 1;

      // Event accesses
      for (const ge of g.guestEvents) {
        const evName = (ge.event.name || '').toLowerCase();
        const ritualType = (ge.event.settings as any)?.ritualType;
        if (evName.includes('vivaha') || evName.includes('pher') || ritualType === 'VIVAHA') {
          mandapCount += pax;
        }
        if (evName.includes('haldi') || ritualType === 'HALDI') {
          haldiCount += pax;
        }
        if (evName.includes('reception') || ritualType === 'RECEPTION') {
          receptionCount += pax;
        }
      }
    }

    const totalHouseholds = guests.length;
    const archivedHouseholds = await prisma.guest.count({
      where: { weddingId, deletedAt: { not: null } },
    });
    const capacityPercentage = Math.min(100, Math.round((totalPax / 500) * 100));
    const attendingPercentage = totalPax > 0 ? Math.round((confirmedAttending / totalPax) * 100) : 0;

    let mandapHouseholds = 0;
    for (const g of guests) {
      const hasMandap = g.guestEvents.some((ge) => {
        const evName = (ge.event.name || '').toLowerCase();
        const ritualType = (ge.event.settings as any)?.ritualType;
        return evName.includes('vivaha') || evName.includes('mandap') || evName.includes('pher') || ritualType === 'VIVAHA';
      });
      if (hasMandap) mandapHouseholds += 1;
    }

    return {
      totalGuests: totalPax,
      totalHouseholds,
      archivedHouseholds,
      capacityPercentage,
      confirmedAttending,
      awaitingResponse,
      regretfullyDeclined,
      attendingPercentage,
      dietarySplit: {
        pureVeg,
        jainSaatvik,
        nonVeg,
        allergies,
      },
      mandapAccessCount: mandapCount,
      mandapHouseholdsCount: mandapHouseholds,
      mandapUnassignedHouseholdsCount: totalHouseholds - mandapHouseholds,
      haldiAccessCount: haldiCount,
      receptionAccessCount: receptionCount,
    };
  },

  async seedSampleGuests(weddingId: string) {
    await this.seedDefaultCategories(weddingId);
    const categories = await prisma.guestCategory.findMany({ where: { weddingId } });
    const catMap = new Map<string, string>(categories.map((c: any) => [c.name, c.id]));

    // Fetch existing events to link
    const events: any[] = await prisma.event.findMany({ where: { weddingId } });
    const haldiEvent = events.find((e: any) => e.name.toLowerCase().includes('haldi'));
    const sangeetEvent = events.find((e: any) => e.name.toLowerCase().includes('sangeet'));
    const vivahaEvent = events.find((e: any) => e.name.toLowerCase().includes('vivaha') || e.name.toLowerCase().includes('pher'));
    const receptionEvent = events.find((e: any) => e.name.toLowerCase().includes('reception'));

    const allEventIds = events.map((e: any) => e.id);
    const nonHaldiIds = events.filter((e: any) => e.id !== haldiEvent?.id).map((e: any) => e.id);

    const samples: CreateGuestDTO[] = [
      {
        honorific: 'Thakur',
        firstName: 'Vikram Singh',
        lastName: 'Ranawat',
        side: 'GROOM',
        categoryId: catMap.get('👑 Royal Family (VIP)') || null,
        phone: '+91 98290 12345',
        email: 'vikram.ranawat@heritage.in',
        householdName: 'Ranawat Household',
        householdRole: 'HEAD',
        paxCount: 4,
        companions: [
          { name: 'Thakurani Devika Ranawat', relation: 'Spouse', dietary: 'JAIN' },
          { name: 'Kunwar Aditya Ranawat', relation: 'Son', dietary: 'JAIN', dietaryNote: 'Child' },
          { name: 'Baisa Radhika Ranawat', relation: 'Daughter', dietary: 'JAIN' },
        ],
        dietary: 'JAIN',
        dietaryLabel: '🌿 Jain Saatvik (No Root)',
        city: 'Jodhpur, Rajasthan',
        allocatedSuite: 'Lake View Suite #204, Taj Lake Palace',
        rsvpStatus: 'ATTENDING',
        eventIds: allEventIds,
      },
      {
        honorific: 'Maharaj',
        firstName: 'Raghavendra Singh',
        lastName: 'Rathore',
        side: 'BRIDE',
        categoryId: catMap.get('👑 Royal Family (VIP)') || null,
        phone: '+91 98100 88231',
        email: 'raghavendra.rathore@rajasthan.gov.in',
        householdName: 'Rathore Royal Family',
        householdRole: 'HEAD',
        paxCount: 2,
        companions: [{ name: 'Maharani Padmini Rathore', relation: 'Maharani (Spouse)', dietary: 'PURE_VEG' }],
        dietary: 'PURE_VEG',
        dietaryLabel: '🥦 Pure Vegetarian',
        city: 'Jaipur, Rajasthan',
        allocatedSuite: 'Shiv Niwas Palace Royal Suite #101',
        rsvpStatus: 'ATTENDING',
        eventIds: allEventIds,
      },
      {
        honorific: 'Dr.',
        firstName: 'Ananya',
        lastName: 'Mehra & Family',
        side: 'GROOM',
        categoryId: catMap.get('🥂 Close Friends & Inner Circle') || null,
        phone: '+91 99201 44512',
        email: 'ananya.mehra@aiims.edu',
        householdName: 'Mehra Family',
        householdRole: 'HEAD',
        paxCount: 3,
        companions: [
          { name: 'Rohan Mehra', relation: 'Spouse', dietary: 'GLUTEN_FREE' },
          { name: 'Kavya Mehra', relation: 'Teen Daughter', dietary: 'GLUTEN_FREE' },
        ],
        dietary: 'GLUTEN_FREE',
        dietaryLabel: '🌾 Gluten-Free Veg',
        allergies: 'Gluten-Free',
        city: 'Mumbai, Maharashtra',
        allocatedSuite: 'Fateh Prakash Luxury Suite #310',
        rsvpStatus: 'ATTENDING',
        eventIds: nonHaldiIds.length > 0 ? nonHaldiIds : allEventIds,
      },
      {
        honorific: 'Yuvraj',
        firstName: 'Devendra Singh',
        lastName: 'Ranawat',
        side: 'GROOM',
        categoryId: catMap.get('🪷 Immediate Kin') || null,
        phone: '+91 97110 99420',
        email: 'devendra.ranawat@mewar.co',
        householdName: 'Ranawat Kin',
        householdRole: 'SOLO',
        paxCount: 1,
        dietary: 'JAIN',
        dietaryLabel: '🌿 Jain Saatvik (No Onion/Garlic)',
        city: 'Udaipur, Rajasthan',
        allocatedSuite: 'Resident Family Wing, Shiv Niwas',
        rsvpStatus: 'ATTENDING',
        eventIds: allEventIds,
      },
      {
        honorific: 'Shri',
        firstName: 'Priya & Arjun',
        lastName: 'Kapoor',
        side: 'BOTH',
        categoryId: catMap.get('🥂 Close Friends & Inner Circle') || null,
        phone: '+91 98212 77301',
        email: 'arjun.kapoor@venture.in',
        householdName: 'Kapoor Household',
        householdRole: 'HEAD',
        paxCount: 2,
        companions: [{ name: 'Priya Kapoor', relation: 'Spouse', dietary: 'NON_VEG' }],
        dietary: 'NON_VEG',
        dietaryLabel: '🍗 Non-Vegetarian / Multi',
        city: 'New Delhi',
        allocatedSuite: 'Trident Palace Wing #408',
        rsvpStatus: 'AWAITING',
        eventIds: [vivahaEvent?.id, receptionEvent?.id].filter(Boolean) as string[],
      },
      {
        honorific: 'Justice',
        firstName: 'Rajeshwar Dayal',
        lastName: '& Family',
        side: 'BRIDE',
        categoryId: catMap.get('🏛️ Corporate & Dignitaries') || null,
        phone: '+91 98450 33119',
        email: 'justice.dayal@judiciary.gov.in',
        householdName: 'Dayal Household',
        householdRole: 'HEAD',
        paxCount: 4,
        companions: [
          { name: 'Smt. Shashi Dayal', relation: 'Spouse', dietary: 'PURE_VEG' },
          { name: 'Advocate Siddharth Dayal', relation: 'Son', dietary: 'PURE_VEG' },
          { name: 'Dr. Meenakshi Dayal', relation: 'Daughter-in-law', dietary: 'PURE_VEG' },
        ],
        dietary: 'PURE_VEG',
        dietaryLabel: '🥦 Pure Vegetarian • Nut Allergy',
        allergies: 'Severe Nut Allergy',
        city: 'Bengaluru, Karnataka',
        allocatedSuite: 'Oberoi Udaivilas Royal Villa',
        rsvpStatus: 'ATTENDING',
        eventIds: nonHaldiIds.length > 0 ? nonHaldiIds : allEventIds,
      },
    ];

    for (const sample of samples) {
      await this.create(weddingId, sample);
    }
  },
};
