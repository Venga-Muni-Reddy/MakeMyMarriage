import prisma from '../../infrastructure/prisma/client';
import { PhotoVisibility, PhotoModerationStatus, MediaProvider, Prisma } from '@prisma/client';
import { RegisterPhotoDto, PhotoQueryFilter, ModeratePhotoDto, MediaTelemetryDto } from './media.types';

export class MediaRepository {
  /**
   * Find photos with comprehensive filters and relations
   */
  async findPhotos(weddingId: string, filter: PhotoQueryFilter = {}) {
    const where: Prisma.PhotoWhereInput = {
      weddingId,
      deletedAt: null,
    };

    const isUuid = (str?: string) =>
      typeof str === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

    if (filter.eventId && filter.eventId !== 'all') {
      if (isUuid(filter.eventId)) {
        where.eventId = filter.eventId;
      } else {
        where.event = {
          name: { contains: filter.eventId, mode: 'insensitive' },
        };
      }
    }

    if (filter.visibility) {
      where.visibility = filter.visibility;
    }

    if (filter.moderationStatus) {
      where.moderationStatus = filter.moderationStatus;
    }

    if (filter.search && filter.search.trim()) {
      const q = filter.search.trim();
      where.OR = [
        { caption: { contains: q, mode: 'insensitive' } },
        { uploadedByGuest: { displayName: { contains: q, mode: 'insensitive' } } },
        { uploadedByUser: { name: { contains: q, mode: 'insensitive' } } },
        { event: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    let orderBy: Prisma.PhotoOrderByWithRelationInput = { createdAt: 'desc' };
    if (filter.sortBy === 'ceremony_order') {
      orderBy = { event: { startAt: 'asc' } };
    } else if (filter.sortBy === 'pending') {
      where.moderationStatus = PhotoModerationStatus.PENDING;
      orderBy = { createdAt: 'desc' };
    }

    const photos = await prisma.photo.findMany({
      where,
      orderBy,
      include: {
        mediaAsset: true,
        event: {
          select: {
            id: true,
            name: true,
            startAt: true,
            venue: { select: { name: true } },
          },
        },
        uploadedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        uploadedByGuest: {
          select: {
            id: true,
            displayName: true,
            side: true,
          },
        },
      },
    });

    const mapped = photos.map(this.serializePhoto);

    if (filter.sortBy === 'most_liked') {
      mapped.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    }

    return mapped;
  }

  /**
   * Find a photo by ID
   */
  async findById(photoId: string, weddingId?: string) {
    const photo = await prisma.photo.findFirst({
      where: {
        id: photoId,
        ...(weddingId ? { weddingId } : {}),
        deletedAt: null,
      },
      include: {
        mediaAsset: true,
        event: {
          select: {
            id: true,
            name: true,
            startAt: true,
            venue: { select: { name: true } },
          },
        },
        uploadedByUser: {
          select: { id: true, name: true, email: true },
        },
        uploadedByGuest: {
          select: { id: true, displayName: true, side: true },
        },
      },
    });

    return photo ? this.serializePhoto(photo) : null;
  }

  /**
   * Register a photo and its MediaAsset
   */
  async createPhoto(
    weddingId: string,
    dto: RegisterPhotoDto,
    uploaderUserId?: string,
    uploaderGuestId?: string
  ) {
    const mediaAsset = await prisma.mediaAsset.create({
      data: {
        provider: MediaProvider.CLOUDINARY,
        providerAssetId: dto.providerAssetId || dto.publicId,
        publicId: dto.publicId,
        secureUrl: dto.secureUrl,
        resourceType: dto.resourceType || 'image',
        format: dto.format || 'jpg',
        width: dto.width || 1920,
        height: dto.height || 1080,
        bytes: dto.bytes ? BigInt(dto.bytes) : null,
        metadata: {
          guestName: dto.guestName || null,
          tableNumber: dto.tableNumber || null,
          cameraModel: dto.cameraModel || 'Sony A7R V',
          likesCount: 0,
          likedBy: [],
        },
      },
    });

    const isUuid = (str?: string) =>
      typeof str === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

    let resolvedEventId: string | null = null;
    if (dto.eventId) {
      if (isUuid(dto.eventId)) {
        resolvedEventId = dto.eventId;
      } else {
        const ev = await prisma.event.findFirst({
          where: {
            weddingId,
            name: { contains: dto.eventId, mode: 'insensitive' },
          },
          select: { id: true },
        });
        resolvedEventId = ev?.id || null;
      }
    }

    let resolvedUserId: string | null = null;
    if (uploaderUserId && isUuid(uploaderUserId)) {
      const userExists = await prisma.user.findUnique({
        where: { id: uploaderUserId },
        select: { id: true },
      });
      if (userExists) resolvedUserId = userExists.id;
    }

    const photo = await prisma.photo.create({
      data: {
        weddingId,
        eventId: resolvedEventId,
        uploadedByUserId: resolvedUserId,
        uploadedByGuestId: uploaderGuestId && isUuid(uploaderGuestId) ? uploaderGuestId : null,
        mediaAssetId: mediaAsset.id,
        visibility: dto.visibility || PhotoVisibility.PUBLIC,
        moderationStatus: resolvedUserId
          ? PhotoModerationStatus.APPROVED
          : PhotoModerationStatus.PENDING,
        caption: dto.caption || null,
      },
      include: {
        mediaAsset: true,
        event: {
          select: { id: true, name: true, startAt: true, venue: { select: { name: true } } },
        },
        uploadedByUser: { select: { id: true, name: true, email: true } },
        uploadedByGuest: { select: { id: true, displayName: true, side: true } },
      },
    });

    return this.serializePhoto(photo);
  }

  /**
   * Update photo moderation status
   */
  async updateModeration(photoId: string, weddingId: string, dto: ModeratePhotoDto) {
    const photo = await prisma.photo.update({
      where: { id: photoId },
      data: {
        moderationStatus: dto.moderationStatus,
        ...(dto.visibility ? { visibility: dto.visibility } : {}),
      },
      include: {
        mediaAsset: true,
        event: {
          select: { id: true, name: true, startAt: true, venue: { select: { name: true } } },
        },
        uploadedByUser: { select: { id: true, name: true, email: true } },
        uploadedByGuest: { select: { id: true, displayName: true, side: true } },
      },
    });

    return this.serializePhoto(photo);
  }

  /**
   * Toggle like counter for a photo
   */
  async toggleLike(photoId: string, weddingId: string, userOrGuestId: string) {
    const photo = await prisma.photo.findFirst({
      where: { id: photoId, weddingId, deletedAt: null },
      include: { mediaAsset: true },
    });

    if (!photo || !photo.mediaAsset) return null;

    const meta = (photo.mediaAsset.metadata as Record<string, any>) || {};
    const likedBy: string[] = Array.isArray(meta.likedBy) ? meta.likedBy : [];
    const index = likedBy.indexOf(userOrGuestId);

    let newLikedBy: string[];
    let newLikesCount: number;

    if (index > -1) {
      newLikedBy = likedBy.filter((id) => id !== userOrGuestId);
      newLikesCount = Math.max(0, (meta.likesCount || 1) - 1);
    } else {
      newLikedBy = [...likedBy, userOrGuestId];
      newLikesCount = (meta.likesCount || 0) + 1;
    }

    await prisma.mediaAsset.update({
      where: { id: photo.mediaAsset.id },
      data: {
        metadata: {
          ...meta,
          likesCount: newLikesCount,
          likedBy: newLikedBy,
        },
      },
    });

    return this.findById(photoId, weddingId);
  }

  /**
   * Soft delete photo
   */
  async softDelete(photoId: string, _weddingId: string) {
    return prisma.photo.update({
      where: { id: photoId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Get media telemetry & aggregates for a wedding
   */
  async getTelemetry(weddingId: string): Promise<MediaTelemetryDto> {
    const photos = await prisma.photo.findMany({
      where: { weddingId, deletedAt: null },
      include: {
        mediaAsset: true,
        event: { select: { id: true, name: true } },
      },
    });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let pendingReview = 0;
    let approvedCount = 0;
    let banquetQrScans = 0;
    let todayUploadsCount = 0;
    let totalBytes = 0;
    const albumMap: Record<string, { id: string; name: string; count: number }> = {};

    for (const p of photos) {
      if (p.moderationStatus === PhotoModerationStatus.PENDING) pendingReview++;
      if (p.moderationStatus === PhotoModerationStatus.APPROVED) approvedCount++;
      if (p.uploadedByGuestId || (p.mediaAsset.metadata as any)?.tableNumber) banquetQrScans++;
      if (p.createdAt >= startOfToday) todayUploadsCount++;

      if (p.mediaAsset.bytes) {
        totalBytes += Number(p.mediaAsset.bytes);
      }

      const eventKey = p.event ? p.event.id : 'unassigned';
      const eventName = p.event ? p.event.name : 'General & Candids';

      if (!albumMap[eventKey]) {
        albumMap[eventKey] = { id: eventKey, name: eventName, count: 0 };
      }
      albumMap[eventKey].count++;
    }

    const albums = Object.values(albumMap);

    return {
      totalMemories: photos.length,
      ritualAlbums: Math.max(albums.length, 1),
      banquetQrScans,
      pendingReview,
      totalBytes,
      approvedCount,
      todayUploadsCount,
      albums,
    };
  }

  /**
   * Seed authentic Royal Udaipur showcase photos if repository is empty
   */
  async seedRoyalPhotosIfEmpty(weddingId: string) {
    const count = await prisma.photo.count({
      where: { weddingId, deletedAt: null },
    });

    if (count > 0) return;

    // Fetch ceremonies to associate photos with real events if available
    const events = await prisma.event.findMany({
      where: { weddingId },
      select: { id: true, name: true },
    });

    const findEventId = (keyword: string) => {
      const ev = events.find((e: { id: string; name: string }) =>
        e.name.toLowerCase().includes(keyword.toLowerCase())
      );
      return ev?.id || null;
    };

    const showcaseData = [
      {
        publicId: 'makemymarriage/udaipur/bride_muhurtham',
        secureUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDOMFH7zmbyn7QwNNPEGlL8IdDaCy3a5KYXZxi4CzApkOUxuUXKjnQoFEBkRUZvMdKJlauugOi_VmZCi4Z-L7f2Gcj1Dl-6LiLyNsUkw62MAmgHp6WzEqV_Lh0AsyuR2S-CPgWS5A3m0EDHKnDBMSHJMQ5GF8wsEgR9WtvKczinRm4WW_GOm1YcxTYRcIWHG8p0pvsDcNB7hYFo3FeyiMRzgd_TFOqFLTqUpO-fu88HcBHZyMVG_jFHnw',
        caption: 'The Divine Mangalashtak — Sabyasachi Royal Crimson Lehenga',
        cameraModel: 'Sony A7R V (GM 50mm f/1.2)',
        likesCount: 48,
        guestName: 'Rohan Varma',
        tableNumber: 'Table 7',
        eventKeyword: 'muhurat',
        status: PhotoModerationStatus.APPROVED,
        aspectRatio: '3/4',
      },
      {
        publicId: 'makemymarriage/udaipur/groom_baraat',
        secureUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAuHxNGrvzGMkX0dw4HMIKpNLSzkIMWnKd-7hO94xcq8EdoIdtJWqvvOlvZ9xfs3wnlmQobr7t3b6veEK3eMYuHFfpIRWHATYMg4cwRxG54mS1JgJw1m9arQFnUKSJ2o91zUGSPzQNx8vWxt2ZTPReHtB9eE3nfZQmj90ls3OoEQocev2d04tlsqVw7BxS29T0PTz8ln2L4PSLKK99YA5tGnMe0VmFCV4OSPCr3PoSUmtsGXoShwB60Tw',
        caption: 'Grand Lakeside Baraat Entrance with Vintage Rolls Royce & Kalgi Safa',
        cameraModel: 'Mewar Studio Pro',
        likesCount: 92,
        guestName: 'Mewar Master Reel',
        tableNumber: null,
        eventKeyword: 'baraat',
        status: PhotoModerationStatus.APPROVED,
        aspectRatio: '4/3',
      },
      {
        publicId: 'makemymarriage/udaipur/haldi_radiance',
        secureUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBzDUU_r4C9-uDgwing4f1jPXK0mnR16MYaP65JyahFlkAuIk_NsjUQDavBZaJXfeGP9Dsp0cct1-vNE4MGsGGm9UP8Hsc33Rr1j5JHKrsKKQQ_Sdub3m8FoHA8mhTJ_H6yTlXN5k4xRi4a8Cd8GEL31JLxrOrXDdxYhaz0kMfJetusoCoh7qVkkMRSUYcoZRl6nFkdqWQt32EwMbSaHPCBA8y5uOpgx5SP3Vy3uxqsl8fM6qtrLAkQvA',
        caption: 'Turmeric Sunshine Blessings & Marigold Petal Showers',
        cameraModel: 'iPhone 15 Pro Max',
        likesCount: 35,
        guestName: 'Priya Singhania',
        tableNumber: 'Table 3',
        eventKeyword: 'haldi',
        status: PhotoModerationStatus.APPROVED,
        aspectRatio: '1/1',
      },
      {
        publicId: 'makemymarriage/udaipur/mehendi_artistry',
        secureUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDfZggyE9d2nGAA2s--01rm3wDcDA0JniYajog0vBhUHvns8OLg4mN2L_-xO7ZLsb2NY6YE-_JvV3N6J44OJL_Q0o5MWZYePK-fTvd1hqGEKCJvXA0qIB3JIRiH0xuz-GSVtysRRuwQNWwif23TEmsZsi5ToMZ9YqH4n6J2EU-T-S29sR87cvXUnfOvm59Ilxxt_RRNUMgFvojpPuXYOPfIGcScKy066I26ghU82dfTSM0BfoVU3RcV2Q',
        caption: 'Sojat Organic Peacock & Lotus Henna Patterns with Gold Bangles',
        cameraModel: 'Fujifilm GFX 100 II',
        likesCount: 76,
        guestName: 'Mehendi Lounge Concierge',
        tableNumber: 'Zenana Mahal',
        eventKeyword: 'mehendi',
        status: PhotoModerationStatus.APPROVED,
        aspectRatio: '3/4',
      },
      {
        publicId: 'makemymarriage/udaipur/sangeet_dance',
        secureUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAmOxhICw-FqFMLqT3Zx24N-_l3RGMWBSASCpRsFNA9qG0AJ2vYqGptvGpw6zz7PSfRMbPubUeNpWQfW9f0Il1OzK4MJ7vFWzxS52DL67vdT75fFvK6eHMJiMwov4Mm8in8-x305xawucuI_uyzJAZrZulbSA4m07Jbad1xQV6_hVTbUJDf8dmJDPI5PlLfy6YEZmKWqkVRJuF_8SnszbkHLxgkYnMABf6kL7_NJt1eLKFSqzIohnqnRw',
        caption: 'Family Bollywood Dance Showdown under Tiered Crystal Chandeliers',
        cameraModel: 'Sony A7S III (Stage Front)',
        likesCount: 114,
        guestName: 'Venga Muni Reddy',
        tableNumber: 'VIP Stage 1',
        eventKeyword: 'sangeet',
        status: PhotoModerationStatus.APPROVED,
        aspectRatio: '16/10',
      },
      {
        publicId: 'makemymarriage/udaipur/varmala_island',
        secureUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuCssZR0mOwIKvd0EgZxHUGMkMShVW64B-LLJxO18EXH7o476YNPl1qhW7ccYYblgRxlgzabdfkkztHa-WdgZGqYsoyj39flQT4YdPDxfzf6x94PCeqAN3lXr6iS26BydbVfiKmTu-xMZFzRnqv2updImxUcwiBgPR-JMJujT76D1WVzfQzQSB8QBZR2Ug0LcKYkfBCF8Im0q4MH4RJy8walN-GNMIOF_mDt5Ih7QMgxZO3FPgwxlylmog',
        caption: 'Royal Varmala Exchange at Jagmandir Island Mandap against Shimmering Waters',
        cameraModel: 'Mewar Studio Pro',
        likesCount: 158,
        guestName: 'Official Cinematographer',
        tableNumber: null,
        eventKeyword: 'wedding',
        status: PhotoModerationStatus.APPROVED,
        aspectRatio: '1/1',
      },
      {
        publicId: 'makemymarriage/udaipur/rajasthani_folk',
        secureUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAEEnPWjQFItCPvpeadEsnv3eKBdWVxtjWlHplCamIvyt2ZwFfZae545jxTXD5h9KPRgDYVBs6dx6d631GDTbfo7IxoOxscmsIpYc9gaKLZLunSR8lne5s3R9DyqMwRXfsfzCNjHRSk4u01EXIrzilns0TGghZ2uoNCSs2UAEExF2IX3tpxmEH5n789EokpJv255dC_TUfwuU1OtZb-Z3aNURTXOKw44GVGD-YgXqDDm-17gGztP_x8sQ',
        caption: 'Table 14 Musical Tribute by Saffron Turban Manganiyar Folk Troupe',
        cameraModel: 'Canon EOS R5',
        likesCount: 19,
        guestName: 'Kabir Mehta',
        tableNumber: 'Table 14',
        eventKeyword: 'reception',
        status: PhotoModerationStatus.PENDING,
        aspectRatio: '3/4',
      },
      {
        publicId: 'makemymarriage/udaipur/lake_fireworks',
        secureUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAFzG5zgBakwGCkIvsyw3HSr01WGlvosbZ-TZe-4a-03WPYwd8heDXLfvsE8I9RrUg_i6BYoOLnRk4pBCEnR72W-uVaK40T9H55OruUv1ihm7ecxTmqD52ycBzssb-gT7AQa_dlraCPqjy_3BkNvWrxWS1GKbNMiSrg5l7EvErsflyy_94dtUXNcctLD9NRtidNycw6bOXsNWL_is-x3OZBS6c2f3wNBs8KPb3j_4bV6iOCEJziVlQSrA',
        caption: 'Grand Midnight Lake Pichola Fireworks Illuminating Palace Facades',
        cameraModel: 'DJI Mavic 3 Pro Drone',
        likesCount: 205,
        guestName: 'Drone Cinematics',
        tableNumber: null,
        eventKeyword: 'reception',
        status: PhotoModerationStatus.APPROVED,
        aspectRatio: '16/9',
      },
    ];

    for (const item of showcaseData) {
      const eventId = findEventId(item.eventKeyword) || (events[0] ? events[0].id : null);
      const mediaAsset = await prisma.mediaAsset.create({
        data: {
          provider: MediaProvider.CLOUDINARY,
          providerAssetId: item.publicId,
          publicId: item.publicId,
          secureUrl: item.secureUrl,
          resourceType: 'image',
          format: 'webp',
          width: 1920,
          height: 1280,
          bytes: BigInt(3400000),
          metadata: {
            guestName: item.guestName,
            tableNumber: item.tableNumber,
            cameraModel: item.cameraModel,
            likesCount: item.likesCount,
            aspectRatio: item.aspectRatio,
            likedBy: [],
          },
        },
      });

      await prisma.photo.create({
        data: {
          weddingId,
          eventId,
          mediaAssetId: mediaAsset.id,
          visibility: PhotoVisibility.PUBLIC,
          moderationStatus: item.status,
          caption: item.caption,
        },
      });
    }
  }

  /**
   * Helper to format BigInt and relations into clean JSON
   */
  private serializePhoto(photo: any) {
    const asset = photo.mediaAsset;
    const meta = (asset?.metadata as Record<string, any>) || {};

    return {
      id: photo.id,
      weddingId: photo.weddingId,
      eventId: photo.eventId,
      eventName: photo.event?.name || 'Ceremony Album',
      eventDate: photo.event?.startAt || null,
      venueName: photo.event?.venue?.name || null,
      caption: photo.caption,
      visibility: photo.visibility,
      moderationStatus: photo.moderationStatus,
      createdAt: photo.createdAt,
      mediaAsset: asset
        ? {
            id: asset.id,
            publicId: asset.publicId,
            secureUrl: asset.secureUrl,
            format: asset.format,
            width: asset.width,
            height: asset.height,
            bytes: asset.bytes ? Number(asset.bytes) : null,
            metadata: meta,
          }
        : null,
      uploader: {
        type: photo.uploadedByUserId ? 'HOST' : photo.uploadedByGuestId ? 'GUEST' : 'QR_SCAN',
        name:
          photo.uploadedByUser?.name ||
          photo.uploadedByGuest?.displayName ||
          meta.guestName ||
          'Esteemed Guest',
        email: photo.uploadedByUser?.email || null,
        tableNumber: meta.tableNumber || null,
        cameraModel: meta.cameraModel || 'Wedding Camera',
      },
      likesCount: meta.likesCount || 0,
      aspectRatio: meta.aspectRatio || '4/3',
    };
  }
}

export const mediaRepository = new MediaRepository();
