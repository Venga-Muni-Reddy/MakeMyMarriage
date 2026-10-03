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
  async seedRoyalPhotosIfEmpty(_weddingId: string) {
    // No-op: Do not seed mock demonstration photos. Only user-uploaded photos should be shown.
    return;
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
