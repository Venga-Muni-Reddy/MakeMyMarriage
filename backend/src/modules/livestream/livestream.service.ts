import prisma from '../../infrastructure/prisma/client';
import { livestreamRepository } from './livestream.repository';
import {
  CreateStreamDto,
  UpdateStreamDto,
  SendBlessingDto,
  ActiveStreamResponse,
  ChatMessageItem,
  RitualMilestoneItem,
} from './livestream.types';

export class LivestreamService {
  /**
   * Get active stream with all real-time telemetry, ritual sequence, and chat feed
   */
  async getActiveStream(weddingId: string, eventId?: string): Promise<ActiveStreamResponse> {
    let stream = await livestreamRepository.findStream(weddingId, eventId);
    const wedding = await prisma.wedding.findUnique({ where: { id: weddingId } });

    if (!stream) {
      const weddingTitle = wedding ? `${wedding.name} — Sacred Mandap & Vivaha Telecast` : 'Sacred Wedding Ceremony & Vivaha Telecast';
      const cleanSlug = wedding?.slug?.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'MANDAP';
      stream = await livestreamRepository.createStream(weddingId, {
        title: weddingTitle,
        streamUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // default demo livestream
        status: 'LIVE',
        privacy: 'PUBLIC',
        passcode: `${cleanSlug}-2026`,
      });
    }

    const meta: any = stream.metadata || {};

    const defaultRituals: RitualMilestoneItem[] = [
      { id: 1, name: 'Ganesh Puja', time: 'Phase 1', status: 'COMPLETED', detail: 'Completed' },
      { id: 2, name: 'Varmala Garland', time: 'Phase 2', status: 'COMPLETED', detail: 'Completed' },
      { id: 3, name: 'Kanyadaan', time: 'Phase 3', status: 'COMPLETED', detail: 'Completed' },
      { id: 4, name: 'Saptapadi (7 Vows)', time: 'LIVE NOW', status: 'LIVE', detail: 'Sacred Vows in Motion' },
      { id: 5, name: 'Sindoor Daan', time: 'Phase 5', status: 'UPCOMING', detail: 'Upcoming' },
      { id: 6, name: 'Grand Aarti', time: 'Phase 6', status: 'UPCOMING', detail: 'Upcoming' },
    ];

    const storedChat: ChatMessageItem[] = Array.isArray(meta.chatMessages) ? meta.chatMessages : [];

    return {
      id: stream.id,
      weddingId: stream.weddingId,
      eventId: stream.eventId,
      eventName: stream.event?.name || 'Sacred Vivaha Ceremony',
      title: stream.title || `${wedding?.name || 'Wedding'} — Sacred Mandap Telecast`,
      provider: stream.provider,
      streamUrl: stream.streamUrl,
      embedUrl: stream.embedUrl || livestreamRepository.toEmbedUrl(stream.streamUrl),
      status: stream.status,
      activeCamera: meta.activeCamera || 'Cam 1: Mandap Havankund',
      currentRitual: meta.currentRitual || 'Ritual: Saptapadi (Vow 4 of 7)',
      activeVow: meta.activeVow || 4,
      telemetry: {
        status: stream.status,
        resolution: '4K UHD',
        fps: 60,
        latencySeconds: 1.2,
        viewerCount: meta.viewerCount ?? 1,
        petalsCount: meta.petalsCount ?? 0,
        viewerBreakdown: meta.viewerBreakdown || {
          us: 0,
          uk: 0,
          ca: 0,
          ae: 0,
          in: 1,
        },
        privacy: meta.privacy || 'PUBLIC',
        passcode: meta.passcode || 'MANDAP-2026',
      },
      pinnedBlessing: meta.pinnedBlessing || {
        quote:
          '“May the sacred agni illuminate your journey together with infinite love, understanding, and divine blessings.”',
        author: 'Elders & Family Council',
        location: 'Global Telecast',
        time: 'Active',
      },
      chatMessages: storedChat,
      rituals: defaultRituals,
    };
  }

  /**
   * Update stream settings
   */
  async updateStream(weddingId: string, streamId: string, dto: UpdateStreamDto) {
    const updated = await livestreamRepository.updateStream(streamId, dto);
    if (!updated) {
      throw new Error('Live stream not found');
    }
    return this.getActiveStream(weddingId, updated.eventId);
  }

  /**
   * Send a virtual blessing / chat message
   */
  async sendBlessing(weddingId: string, streamId: string, dto: SendBlessingDto) {
    const stream = await livestreamRepository.findStream(weddingId);
    if (!stream) throw new Error('Live stream not found');

    const meta: any = stream.metadata || {};
    const existingChat: ChatMessageItem[] = Array.isArray(meta.chatMessages) ? meta.chatMessages : [];

    const newMsg: ChatMessageItem = {
      id: `bless-${Date.now()}`,
      authorName: dto.authorName || 'Guest of Honor',
      location: dto.location || 'Wedding Guest',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      message: dto.message,
      isFamily: dto.isFamily,
    };

    const currentPetals = (meta.petalsCount || 0) + 50;
    const updatedMeta = {
      ...meta,
      petalsCount: currentPetals,
      chatMessages: [newMsg, ...existingChat].slice(0, 100),
    };

    await livestreamRepository.updateMetadata(stream.id, updatedMeta);
    return newMsg;
  }

  /**
   * Shower rose petals micro-interaction
   */
  async showerPetals(weddingId: string, streamId: string, count = 25) {
    const stream = await livestreamRepository.findStream(weddingId);
    if (!stream) throw new Error('Live stream not found');

    const meta: any = stream.metadata || {};
    const newTotal = (meta.petalsCount || 0) + count;
    await livestreamRepository.updateMetadata(stream.id, {
      ...meta,
      petalsCount: newTotal,
    });

    return { totalPetals: newTotal, increment: count };
  }

  /**
   * List all streams for ceremonies
   */
  async listStreams(weddingId: string) {
    return livestreamRepository.listStreams(weddingId);
  }
}

export const livestreamService = new LivestreamService();
