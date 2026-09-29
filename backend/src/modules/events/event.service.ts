import { eventRepository } from './event.repository';
import { weddingRepository } from '../weddings/wedding.repository';
import { NotFoundError } from '../../shared/errors/api-error';

export class EventService {
  async getEvents(weddingId: string) {
    const wedding = await weddingRepository.findById(weddingId);
    if (!wedding) {
      throw new NotFoundError('Wedding workspace not found');
    }

    const events = await eventRepository.findByWeddingId(weddingId);
    if (events.length === 0) {
      // Auto-seed standard ceremonies based on the wedding date
      const baseDate = wedding.weddingDate ? wedding.weddingDate.toISOString() : undefined;
      return eventRepository.seedDefaultCeremonies(weddingId, baseDate);
    }

    return events;
  }

  async getEventById(weddingId: string, eventId: string) {
    const event = await eventRepository.findById(eventId);
    if (!event || event.weddingId !== weddingId) {
      throw new NotFoundError('Ceremony event not found');
    }
    return event;
  }

  async createEvent(weddingId: string, data: any) {
    const wedding = await weddingRepository.findById(weddingId);
    if (!wedding) {
      throw new NotFoundError('Wedding workspace not found');
    }
    return eventRepository.create(weddingId, data);
  }

  async updateEvent(weddingId: string, eventId: string, data: any) {
    const event = await eventRepository.findById(eventId);
    if (!event || event.weddingId !== weddingId) {
      throw new NotFoundError('Ceremony event not found');
    }
    return eventRepository.update(eventId, data);
  }

  async deleteEvent(weddingId: string, eventId: string) {
    const event = await eventRepository.findById(eventId);
    if (!event || event.weddingId !== weddingId) {
      throw new NotFoundError('Ceremony event not found');
    }
    return eventRepository.softDelete(eventId);
  }

  async seedTemplates(weddingId: string) {
    const wedding = await weddingRepository.findById(weddingId);
    if (!wedding) {
      throw new NotFoundError('Wedding workspace not found');
    }
    const baseDate = wedding.weddingDate ? wedding.weddingDate.toISOString() : undefined;
    return eventRepository.seedDefaultCeremonies(weddingId, baseDate);
  }
}

export const eventService = new EventService();
