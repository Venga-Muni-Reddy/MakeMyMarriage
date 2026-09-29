import { guestRepository } from './guest.repository';
import { CreateGuestDTO, UpdateGuestDTO, GuestQueryFilters } from './guest.types';
import { NotFoundError } from '../../shared/errors/api-error';

export const guestService = {
  async getGuests(weddingId: string, filters: GuestQueryFilters) {
    // If wedding has 0 guests, auto-seed the royal Rajputana household roster
    const countCheck = await guestRepository.findMany(weddingId, { limit: 1 });
    if (countCheck.total === 0) {
      await guestRepository.seedSampleGuests(weddingId);
    }

    const [result, telemetry, categories] = await Promise.all([
      guestRepository.findMany(weddingId, filters),
      guestRepository.calculateTelemetry(weddingId),
      guestRepository.findCategories(weddingId),
    ]);

    return {
      ...result,
      telemetry,
      categories,
    };
  },

  async getGuest(weddingId: string, guestId: string) {
    const guest = await guestRepository.findById(weddingId, guestId);
    if (!guest) {
      throw new NotFoundError('Royal Guest not found in this wedding chancery');
    }
    return guest;
  },

  async createGuest(weddingId: string, data: CreateGuestDTO) {
    return guestRepository.create(weddingId, data);
  },

  async updateGuest(weddingId: string, guestId: string, data: UpdateGuestDTO) {
    const updated = await guestRepository.update(weddingId, guestId, data);
    if (!updated) {
      throw new NotFoundError('Royal Guest not found in this wedding chancery');
    }
    return updated;
  },

  async deleteGuest(weddingId: string, guestId: string) {
    const deleted = await guestRepository.delete(weddingId, guestId);
    if (!deleted) {
      throw new NotFoundError('Royal Guest not found in this wedding chancery');
    }
    return { success: true };
  },

  async unarchiveGuest(weddingId: string, guestId: string) {
    const restored = await guestRepository.unarchive(weddingId, guestId);
    if (!restored) {
      throw new NotFoundError('Royal Guest not found in this wedding chancery');
    }
    return { success: true };
  },

  async bulkAction(
    weddingId: string,
    payload: {
      guestIds: string[];
      action: 'ASSIGN_CEREMONY' | 'UPDATE_DIETARY' | 'ARCHIVE' | 'UNARCHIVE' | 'DISPATCH_WHATSAPP';
      eventId?: string;
      dietary?: string;
    }
  ) {
    const { guestIds, action, eventId, dietary } = payload;

    if (action === 'ASSIGN_CEREMONY') {
      if (!eventId) throw new Error('Ceremony eventId is required for assignment');
      const count = await guestRepository.bulkAssignCeremony(weddingId, guestIds, eventId);
      return { success: true, count, message: `${count} guests granted ceremonial mandap access` };
    }

    if (action === 'UPDATE_DIETARY') {
      if (!dietary) throw new Error('Dietary preference is required');
      const count = await guestRepository.bulkUpdateDietary(weddingId, guestIds, dietary);
      return { success: true, count, message: `${count} guests updated with dietary mandate` };
    }

    if (action === 'ARCHIVE') {
      const count = await guestRepository.bulkArchive(weddingId, guestIds);
      return { success: true, count, message: `${count} guests archived from chancery roll` };
    }

    if (action === 'UNARCHIVE') {
      const count = await guestRepository.bulkUnarchive(weddingId, guestIds);
      return { success: true, count, message: `${count} guests restored to active chancery roll` };
    }

    if (action === 'DISPATCH_WHATSAPP') {
      return {
        success: true,
        count: guestIds.length,
        message: `${guestIds.length} digital imperial passes queued for WhatsApp dispatch`,
      };
    }

    return { success: true };
  },

  async getCategories(weddingId: string) {
    return guestRepository.findCategories(weddingId);
  },

  async createCategory(weddingId: string, name: string) {
    return guestRepository.createCategory(weddingId, name);
  },

  async getTelemetry(weddingId: string) {
    return guestRepository.calculateTelemetry(weddingId);
  },

  async exportGuestsCsv(weddingId: string): Promise<string> {
    const result = await guestRepository.findMany(weddingId, { limit: 1000 });
    const headers = [
      'Honorific',
      'First Name',
      'Last Name',
      'Display Name',
      'Affiliation Side',
      'Circle / Category',
      'Phone',
      'Email',
      'Household Name',
      'Household Pax',
      'Dietary Mandate',
      'Allergies',
      'City',
      'Assigned Suite',
      'RSVP Status',
      'QR Digital Pass Code',
    ];

    const rows = result.items.map((g: any) => {
      const m = (g.metadata as Record<string, any>) || {};
      return [
        `"${m.honorific || ''}"`,
        `"${g.firstName || ''}"`,
        `"${g.lastName || ''}"`,
        `"${g.displayName || ''}"`,
        `"${g.side || ''}"`,
        `"${g.category?.name || ''}"`,
        `"${g.phone || ''}"`,
        `"${g.email || ''}"`,
        `"${m.householdName || ''}"`,
        `"${m.paxCount || 1}"`,
        `"${m.dietaryLabel || m.dietary || ''}"`,
        `"${m.allergies || ''}"`,
        `"${m.city || ''}"`,
        `"${m.allocatedSuite || ''}"`,
        `"${m.rsvpStatus || 'AWAITING'}"`,
        `"${m.qrPassCode || ''}"`,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  },
};
