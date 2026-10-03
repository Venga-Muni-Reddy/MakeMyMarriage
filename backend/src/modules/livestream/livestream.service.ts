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

    if (!stream) {
      stream = await livestreamRepository.createStream(weddingId, {
        title: 'Ananya & Rahul — Sacred Vivaha Pheras • Live from The Leela Palace, Udaipur',
        streamUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // default demo livestream
        status: 'LIVE',
        privacy: 'PRIVATE',
        passcode: 'MEWAR-2026',
      });
    }

    const meta: any = stream.metadata || {};

    const defaultRituals: RitualMilestoneItem[] = [
      { id: 1, name: 'Ganesh Puja', time: '19:30', status: 'COMPLETED', detail: 'Completed' },
      { id: 2, name: 'Varmala Garland', time: '20:00', status: 'COMPLETED', detail: 'Completed' },
      { id: 3, name: 'Kanyadaan', time: '20:25', status: 'COMPLETED', detail: 'Completed' },
      { id: 4, name: 'Saptapadi (7 Vows)', time: 'LIVE NOW', status: 'LIVE', detail: 'Phera 4 / 7 in Motion' },
      { id: 5, name: 'Sindoor Daan', time: '21:10', status: 'UPCOMING', detail: 'Upcoming' },
      { id: 6, name: 'Grand Aarti', time: '21:30', status: 'UPCOMING', detail: 'Upcoming' },
    ];

    const defaultChat: ChatMessageItem[] = [
      {
        id: 'msg-1',
        authorName: 'Vikramaditya Rathore',
        location: '🇺🇸 San Francisco',
        time: '19:42',
        message: 'Wishing both families eternal prosperity and infinite joy! Har Har Mahadev 🙏✨',
      },
      {
        id: 'msg-2',
        authorName: 'Meera Singhania',
        location: '🇬🇧 London',
        time: '19:43',
        message: 'The rose flower shower was breathtaking! Sending oceans of love to dearest Ananya 💖🌹',
        isFamily: true,
      },
      {
        id: 'msg-3',
        authorName: 'Siddharth Roy',
        location: '🇨🇦 Toronto',
        time: '19:44',
        message: 'Crystal clear 4K broadcast quality! Congratulations Rahul bhai, you both look divine!',
      },
      {
        id: 'msg-4',
        authorName: 'Anjali Sharma',
        location: '🇦🇪 Dubai',
        time: '19:45',
        message: 'So emotional seeing Kanyadaan live. Hugest hugs and best wishes to both couples from Dubai! 🪔🕊️',
      },
      {
        id: 'msg-5',
        authorName: 'Shailesh Mehta',
        location: '🇮🇳 Udaipur',
        time: '19:46',
        message: 'Flotilla guests arriving safely at the jetty. The Saptapadi mantras are resonating across the lake.',
      },
    ];

    const storedChat: ChatMessageItem[] = Array.isArray(meta.chatMessages) ? meta.chatMessages : [];
    const allChat = [...storedChat, ...defaultChat];

    return {
      id: stream.id,
      weddingId: stream.weddingId,
      eventId: stream.eventId,
      eventName: stream.event?.name || 'Sacred Muhurtham & Pheras',
      title: stream.title,
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
        viewerCount: meta.viewerCount || 1420,
        petalsCount: meta.petalsCount || 18450,
        viewerBreakdown: {
          us: 420,
          uk: 280,
          ca: 190,
          ae: 140,
          in: 390,
        },
        privacy: meta.privacy || 'PRIVATE',
        passcode: meta.passcode || 'MEWAR-2026',
      },
      pinnedBlessing: {
        quote:
          '“Ayushman Bhava! Sending our deepest blessings and tears of joy to our grandchildren Ananya & Rahul. The sacred mandap looks sublime across the screen!”',
        author: 'Dadi & Dada (Harishchandra & Gayatri Mewar)',
        location: 'London, 🇬🇧',
        time: '10m ago',
      },
      chatMessages: allChat,
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
      location: dto.location || '🇮🇳 Royal Mandap',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      message: dto.message,
      isFamily: dto.isFamily,
    };

    const currentPetals = (meta.petalsCount || 18450) + 50;
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
    const newTotal = (meta.petalsCount || 18450) + count;
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
