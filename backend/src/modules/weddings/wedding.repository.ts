import prisma from '../../infrastructure/prisma/client';
import { CreateWeddingDTO, UpdateWeddingDTO } from './wedding.types';

export class WeddingRepository {
  private static defaultRolesInitialized = false;

  private async ensureDefaultRoles() {
    if (WeddingRepository.defaultRolesInitialized) return;

    const roles = [
      { name: 'OWNER', description: 'Wedding workspace creator with sovereign administrative authority' },
      { name: 'ORGANIZER', description: 'Lead wedding planner / event director with operational authority' },
      { name: 'COLLABORATOR', description: 'Family host / vendor coordinator with delegated authority' },
      { name: 'VIEWER', description: 'Read-only family member or preview guest' },
    ];

    for (const r of roles) {
      await prisma.role.upsert({
        where: { name: r.name },
        update: {},
        create: {
          name: r.name,
          description: r.description,
          permissions: {},
        },
      });
    }

    WeddingRepository.defaultRolesInitialized = true;
  }

  async create(ownerId: string, data: CreateWeddingDTO) {
    await this.ensureDefaultRoles();

    const ownerRole = await prisma.role.findUnique({
      where: { name: 'OWNER' },
    });

    if (!ownerRole) throw new Error('OWNER role not found');

    const title =
      data.title || `The Royal Union of ${data.partner1Name} & ${data.partner2Name}`;
    const slug = data.slug || this.generateSlug(data.partner1Name, data.partner2Name);

    const weddingDate = data.startDate ? new Date(data.startDate) : null;

    const settings = {
      partner1Name: data.partner1Name,
      partner2Name: data.partner2Name,
      themePalette: data.themePalette || 'gold',
      primaryCity: data.primaryCity || 'Udaipur, Rajasthan',
      primaryVenueName: data.primaryVenueName || 'The Leela Palace',
      ...(data.settings || {}),
    };

    return prisma.$transaction(async (tx) => {
      const wedding = await tx.wedding.create({
        data: {
          ownerId,
          name: title,
          slug,
          weddingDate,
          timezone: data.timezone || 'Asia/Kolkata',
          settings,
          status: 'ACTIVE',
          visibility: 'PRIVATE',
        },
      });

      // Add owner membership
      await tx.weddingMember.create({
        data: {
          weddingId: wedding.id,
          userId: ownerId,
          roleId: ownerRole.id,
          status: 'ACTIVE',
          joinedAt: new Date(),
        },
      });

      // Optionally create primary venue
      if (data.primaryVenueName || data.primaryCity) {
        await tx.venue.create({
          data: {
            weddingId: wedding.id,
            name: data.primaryVenueName || 'Main Wedding Palace',
            addressLine1: data.primaryVenueName || 'Palace Courtyard',
            city: data.primaryCity || 'Udaipur',
            state: 'Rajasthan',
            postalCode: '313001',
            countryCode: 'IN',
          },
        });
      }

      return wedding;
    });
  }

  async findById(id: string) {
    return prisma.wedding.findFirst({
      where: { id, deletedAt: null },
      include: {
        venues: { where: { deletedAt: null } },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, preferredLanguage: true },
            },
            role: true,
          },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    return prisma.wedding.findFirst({
      where: {
        slug: { equals: slug.toLowerCase().trim(), mode: 'insensitive' },
        deletedAt: null,
      },
      include: {
        venues: { where: { deletedAt: null } },
      },
    });
  }

  async findAllByUserId(userId: string) {
    return prisma.wedding.findMany({
      where: {
        deletedAt: null,
        members: {
          some: {
            userId,
            status: 'ACTIVE',
          },
        },
      },
      include: {
        members: {
          where: { userId },
          include: { role: true },
        },
        venues: { where: { deletedAt: null } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: UpdateWeddingDTO) {
    const updateData: any = {};
    if (data.title !== undefined) updateData.name = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug.toLowerCase().trim();
    if (data.startDate !== undefined) updateData.weddingDate = new Date(data.startDate);
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;
    if (data.settings !== undefined) updateData.settings = data.settings;

    return prisma.wedding.update({
      where: { id },
      data: updateData,
    });
  }

  async softDelete(id: string) {
    return prisma.wedding.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'DELETED',
      },
    });
  }

  async findMembership(weddingId: string, userId: string) {
    return prisma.weddingMember.findUnique({
      where: {
        weddingId_userId: {
          weddingId,
          userId,
        },
      },
      include: {
        role: true,
      },
    });
  }

  async getMembers(weddingId: string) {
    return prisma.weddingMember.findMany({
      where: { weddingId },
      include: {
        user: {
          select: { id: true, name: true, email: true, preferredLanguage: true },
        },
        role: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async assignMemberRole(weddingId: string, userId: string, roleName: string) {
    const role = await prisma.role.findUnique({
      where: { name: roleName.toUpperCase() },
    });
    if (!role) throw new Error(`Role "${roleName}" is not a valid wedding role`);

    return prisma.weddingMember.upsert({
      where: {
        weddingId_userId: {
          weddingId,
          userId,
        },
      },
      update: {
        roleId: role.id,
        status: 'ACTIVE',
        joinedAt: new Date(),
      },
      create: {
        weddingId,
        userId,
        roleId: role.id,
        status: 'ACTIVE',
        joinedAt: new Date(),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        role: true,
      },
    });
  }

  private generateSlug(partner1: string, partner2: string): string {
    const clean1 = partner1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const clean2 = partner2.toLowerCase().replace(/[^a-z0-9]/g, '');
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    return `${clean1}-${clean2}-${year}-${randomSuffix}`;
  }
}

export const weddingRepository = new WeddingRepository();
