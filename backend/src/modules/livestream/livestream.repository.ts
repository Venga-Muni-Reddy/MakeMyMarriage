import prisma from '../../infrastructure/prisma/client';
import { CreateStreamDto, UpdateStreamDto } from './livestream.types';

export class LivestreamRepository {
  /**
   * Find stream by weddingId and optional eventId
   */
  async findStream(weddingId: string, eventId?: string) {
    if (eventId) {
      const match = await prisma.liveStream.findFirst({
        where: { weddingId, eventId },
        include: { event: true },
      });
      if (match) return match;
    }

    return prisma.liveStream.findFirst({
      where: { weddingId },
      orderBy: { createdAt: 'desc' },
      include: { event: true },
    });
  }

  /**
   * List all streams for wedding
   */
  async listStreams(weddingId: string) {
    return prisma.liveStream.findMany({
      where: { weddingId },
      include: { event: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Create new live stream record
   */
  async createStream(weddingId: string, data: CreateStreamDto) {
    let eventId = data.eventId;
    if (!eventId) {
      const event = await prisma.event.findFirst({
        where: { weddingId },
        orderBy: { startAt: 'asc' },
      });
      eventId = event ? event.id : (await this.createDefaultEvent(weddingId)).id;
    }

    return prisma.liveStream.create({
      data: {
        weddingId,
        eventId,
        provider: data.provider || 'YOUTUBE',
        title: data.title,
        streamUrl: data.streamUrl,
        embedUrl: data.embedUrl || this.toEmbedUrl(data.streamUrl),
        status: data.status || 'LIVE',
        metadata: {
          privacy: data.privacy || 'PRIVATE',
          passcode: data.passcode || 'MEWAR-2026',
          viewerCount: 1420,
          petalsCount: 18450,
          activeCamera: 'Cam 1: Mandap Havankund',
          currentRitual: 'Ritual: Saptapadi (Vow 4 of 7)',
          activeVow: 4,
          chatMessages: [],
        },
      },
      include: { event: true },
    });
  }

  /**
   * Update stream record
   */
  async updateStream(streamId: string, data: UpdateStreamDto) {
    const existing = await prisma.liveStream.findUnique({ where: { id: streamId } });
    if (!existing) return null;

    const existingMeta = (existing.metadata as any) || {};

    const updatedMeta = {
      ...existingMeta,
      ...(data.privacy ? { privacy: data.privacy } : {}),
      ...(data.passcode ? { passcode: data.passcode } : {}),
      ...(data.activeCamera ? { activeCamera: data.activeCamera } : {}),
      ...(data.currentRitual ? { currentRitual: data.currentRitual } : {}),
      ...(data.activeVow !== undefined ? { activeVow: data.activeVow } : {}),
    };

    return prisma.liveStream.update({
      where: { id: streamId },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.title ? { title: data.title } : {}),
        ...(data.streamUrl ? { streamUrl: data.streamUrl } : {}),
        ...(data.embedUrl ? { embedUrl: data.embedUrl } : data.streamUrl ? { embedUrl: this.toEmbedUrl(data.streamUrl) } : {}),
        metadata: updatedMeta,
      },
      include: { event: true },
    });
  }

  /**
   * Update metadata directly (e.g. for chat or petal increments)
   */
  async updateMetadata(streamId: string, metadata: any) {
    return prisma.liveStream.update({
      where: { id: streamId },
      data: { metadata },
      include: { event: true },
    });
  }

  /**
   * Helper to ensure an event exists
   */
  private async createDefaultEvent(weddingId: string) {
    return prisma.event.create({
      data: {
        weddingId,
        name: 'Sacred Muhurtham & Pheras',
        startAt: new Date(),
        endAt: new Date(Date.now() + 4 * 3600 * 1000),
        description: 'Vedic Wedding Pheras & Sacred Mandap Rituals',
      },
    });
  }

  /**
   * Convert YouTube URL to standard embed URL
   */
  toEmbedUrl(url: string): string {
    if (!url) return 'https://www.youtube.com/embed/live_stream';
    if (url.includes('embed/')) return url;

    // e.g. youtube.com/watch?v=XXXX
    const vMatch = url.match(/[?&]v=([^&]+)/);
    if (vMatch && vMatch[1]) {
      return `https://www.youtube.com/embed/${vMatch[1]}?autoplay=1&mute=1&enablejsapi=1`;
    }

    // e.g. youtu.be/XXXX
    const beMatch = url.match(/youtu\.be\/([^?&]+)/);
    if (beMatch && beMatch[1]) {
      return `https://www.youtube.com/embed/${beMatch[1]}?autoplay=1&mute=1&enablejsapi=1`;
    }

    // e.g. youtube.com/live/XXXX
    const liveMatch = url.match(/youtube\.com\/live\/([^?&]+)/);
    if (liveMatch && liveMatch[1]) {
      return `https://www.youtube.com/embed/${liveMatch[1]}?autoplay=1&mute=1&enablejsapi=1`;
    }

    return url;
  }
}

export const livestreamRepository = new LivestreamRepository();
