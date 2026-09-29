import prisma from '../../infrastructure/prisma/client';

export class EventRepository {
  async findByWeddingId(weddingId: string) {
    return prisma.event.findMany({
      where: {
        weddingId,
        deletedAt: null,
      },
      include: {
        venue: true,
      },
      orderBy: {
        startAt: 'asc',
      },
    });
  }

  async findById(id: string) {
    return prisma.event.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        venue: true,
      },
    });
  }

  async create(weddingId: string, data: any) {
    const settings = {
      locationName: data.locationName,
      dressCode: data.dressCode,
      dressCodeColors: data.dressCodeColors || [],
      ...(data.settings || {}),
    };

    return prisma.event.create({
      data: {
        weddingId,
        name: data.name,
        description: data.description,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        timezone: data.timezone || 'Asia/Kolkata',
        venueId: data.venueId || null,
        status: data.status || 'SCHEDULED',
        visibility: data.visibility || 'PUBLIC',
        settings,
      },
      include: {
        venue: true,
      },
    });
  }

  async update(id: string, data: any) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.startAt !== undefined) updateData.startAt = new Date(data.startAt);
    if (data.endAt !== undefined) updateData.endAt = new Date(data.endAt);
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.venueId !== undefined) updateData.venueId = data.venueId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;

    if (data.locationName || data.dressCode || data.dressCodeColors || data.settings) {
      const existing = await this.findById(id);
      const existingSettings = (existing?.settings as any) || {};
      updateData.settings = {
        ...existingSettings,
        ...(data.locationName && { locationName: data.locationName }),
        ...(data.dressCode && { dressCode: data.dressCode }),
        ...(data.dressCodeColors && { dressCodeColors: data.dressCodeColors }),
        ...(data.settings || {}),
      };
    }

    return prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        venue: true,
      },
    });
  }

  async softDelete(id: string) {
    return prisma.event.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'CANCELLED',
      },
    });
  }

  async seedDefaultCeremonies(weddingId: string, baseDateStr?: string) {
    const base = baseDateStr ? new Date(baseDateStr) : new Date();

    const d1 = new Date(base);
    const d2 = new Date(base);
    d2.setDate(d2.getDate() + 1);
    const d3 = new Date(base);
    d3.setDate(d3.getDate() + 2);
    const d4 = new Date(base);
    d4.setDate(d4.getDate() + 3);

    const defaultCeremonies = [
      {
        name: 'Sacred Haldi & Mangal Snanam',
        description: 'Phoolon Ki Holi with mountain-grown marigold petals, traditional Rajasthani dholak song circles, and organic turmeric paste rituals.',
        startAt: new Date(d1.setHours(10, 30, 0, 0)),
        endAt: new Date(d1.setHours(13, 30, 0, 0)),
        status: 'SCHEDULED',
        visibility: 'INVITED_GUESTS_ONLY',
        settings: {
          ritualType: 'HALDI',
          locationName: 'Sunlit Marble Courtyard & Poolside Pavilion',
          dressCode: 'Haldi Amber & Sunshine Florals',
          dressCodeColors: ['#F59E0B', '#FBBF24', '#FEF3C7'],
          guestTier: 'Kin & VIP Access (120 Guests)',
          milestones: [
            { time: '10:30 AM', title: 'Arrival & Welcome Thali', description: 'Chandan tilak & fresh coconut water welcome' },
            { time: '11:15 AM', title: 'Traditional Ubtan Paste Rite', description: 'Scented turmeric paste applied by elders' },
            { time: '12:30 PM', title: 'Phoolon Ki Holi Celebration', description: 'Organic marigold flower shower' },
          ],
        },
      },
      {
        name: 'Twilight Sangeet & Musical Gala',
        description: 'A high-energy musical celebration featuring 14 curated family performances, live Sitar jugalbandi, and an after-hours DJ lounge.',
        startAt: new Date(d2.setHours(19, 30, 0, 0)),
        endAt: new Date(d2.setHours(25, 0, 0, 0)), // 01:00 AM next day
        status: 'SCHEDULED',
        visibility: 'PUBLIC',
        settings: {
          ritualType: 'SANGEET',
          locationName: 'Mewar Royal Grand Ballroom & Terraces',
          dressCode: 'Midnight Velvet & Shimmering Lehengas',
          dressCodeColors: ['#1E1B4B', '#C59B27', '#E2E8F0'],
          guestTier: 'All 380 Confirmed Guests Invited',
          milestones: [
            { time: '07:30 PM', title: 'Red Carpet Entrance & Cocktails', description: 'Sparkling flutes & Rajasthani appetizers' },
            { time: '08:45 PM', title: '14 Choreographed Family Acts', description: 'Curated dance performances' },
            { time: '11:00 PM', title: 'Live DJ & Royal Dhol Jugalbandi', description: 'Dance floor open till late night' },
          ],
        },
      },
      {
        name: 'Vedic Vivaha & Lagna Muhurtham',
        description: 'The sacred Hindu wedding ceremony with Vedic chants, traditional Baraat procession, Varmala exchange, and the sacred Saat Pheras around the holy fire.',
        startAt: new Date(d3.setHours(9, 15, 0, 0)),
        endAt: new Date(d3.setHours(14, 0, 0, 0)),
        status: 'SCHEDULED',
        visibility: 'PUBLIC',
        settings: {
          ritualType: 'VIVAHA',
          isMuhurtham: true,
          muhurthamTime: '11:24 AM',
          locationName: 'Palace Lakeside Mandap, The Leela Palace, Udaipur',
          dressCode: 'Vedic Imperial Silk & Crimson Turbans',
          dressCodeColors: ['#9F1239', '#D4AF37', '#FFFDF9'],
          guestTier: 'All 450 Confirmed Guests Invited (100% Clearance)',
          milestones: [
            { time: '09:30 AM', title: 'Royal Baraat Procession', description: 'Vintage Rolls Royce, 18 Nashik Dhol drummers & floral umbrella escort' },
            { time: '10:45 AM', title: 'Varmala on Floating Lake Stage', description: 'Scented tuberose & baby breath garlands with musical shehnai crescendo' },
            { time: '11:24 AM', title: 'Sacred Saat Pheras & Kanyadaan', description: 'Vedic havan ceremony chanted by Pandit Shrikant Shastri' },
            { time: '01:15 PM', title: 'Royal Mewari Bhojan Feast', description: '72-item Satvik thali banquet in the mirrored Sheesh Mahal veranda' },
          ],
        },
      },
      {
        name: 'Grand Royal Reception & Doli Bidaai',
        description: 'An opulent royal evening banquet celebrating the newlyweds with live classical instrumental symphony and ceremonial Doli Bidaai procession.',
        startAt: new Date(d4.setHours(19, 30, 0, 0)),
        endAt: new Date(d4.setHours(24, 0, 0, 0)),
        status: 'SCHEDULED',
        visibility: 'PUBLIC',
        settings: {
          ritualType: 'RECEPTION',
          locationName: 'Royal Jagmandir Island Courtyard',
          dressCode: 'Imperial Black Tie & Heritage Sarees',
          dressCodeColors: ['#0F172A', '#D4AF37', '#64748B'],
          guestTier: 'All Guests, VIP Dignitaries & Kin',
          milestones: [
            { time: '07:30 PM', title: 'Guest Arrival via Royal Boats', description: 'Private ferry crossing across Lake Pichola' },
            { time: '08:30 PM', title: 'Couple Stage Felicitations', description: 'Photographs with royal couple' },
            { time: '11:30 PM', title: 'Ceremonial Doli Bidaai', description: 'Traditional palanquin send-off' },
          ],
        },
      },
    ];

    const created = [];
    for (const c of defaultCeremonies) {
      const e = await prisma.event.create({
        data: {
          weddingId,
          name: c.name,
          description: c.description,
          startAt: c.startAt,
          endAt: c.endAt,
          status: 'SCHEDULED',
          visibility: c.visibility as any,
          settings: c.settings,
        },
      });
      created.push(e);
    }
    return created;
  }
}

export const eventRepository = new EventRepository();
