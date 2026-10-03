import prisma from '../../infrastructure/prisma/client';
import { AuthSecurity } from '../auth/auth.security';
import {
  CreateWeddingDTO,
  UpdateWeddingDTO,
  CollaboratorTelemetry,
  CollaboratorMemberEntity,
} from './wedding.types';
import { MembershipStatus } from '@prisma/client';

export class WeddingRepository {
  private static defaultRolesInitialized = false;

  private async ensureDefaultRoles() {
    if (WeddingRepository.defaultRolesInitialized) return;

    const roles = [
      { name: 'OWNER', description: 'Wedding workspace creator with sovereign administrative authority' },
      { name: 'CO_HOST', description: 'Royal Co-Host / Family Lead with ceremony, invite & guest privileges' },
      { name: 'ORGANIZER', description: 'Lead wedding planner / event director with operational authority' },
      { name: 'PLANNER', description: 'Lead wedding planner / event director with operational authority' },
      { name: 'COLLABORATOR', description: 'Family host / vendor coordinator with delegated authority' },
      { name: 'HOSPITALITY', description: 'Guest registry, suite allocations & gate check-in concierge' },
      { name: 'VIEWER', description: 'Read-only elder observer or preview family member' },
    ];

    for (const r of roles) {
      await prisma.role.upsert({
        where: { name: r.name },
        update: { description: r.description },
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
            status: { in: ['ACTIVE', 'INVITED'] },
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

  async findOrCreateUser(email: string, name?: string) {
    const cleanEmail = email.toLowerCase().trim();
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (!user) {
      const defaultPasswordHash = await AuthSecurity.hashPassword('RoyalVivah2026!');
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          name: name?.trim() || cleanEmail.split('@')[0],
          passwordHash: defaultPasswordHash,
          preferredLanguage: 'en',
        },
      });
    }
    return user;
  }

  async getMembersWithMetadata(weddingId: string): Promise<CollaboratorMemberEntity[]> {
    await this.ensureDefaultRoles();
    const [wedding, members] = await Promise.all([
      prisma.wedding.findUnique({
        where: { id: weddingId },
        select: { settings: true },
      }),
      prisma.weddingMember.findMany({
        where: {
          weddingId,
          status: { not: 'REMOVED' },
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, preferredLanguage: true },
          },
          role: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const settingsObj = (wedding?.settings as any) || {};
    const collaboratorsMeta = settingsObj.collaborators || {};

    const roleOrder: Record<string, number> = {
      OWNER: 1,
      CO_HOST: 2,
      ORGANIZER: 3,
      PLANNER: 4,
      COLLABORATOR: 5,
      HOSPITALITY: 6,
      VIEWER: 7,
    };

    return members
      .map((m) => {
        const meta = collaboratorsMeta[m.id] || collaboratorsMeta[m.user.email] || {};
        const defaultRelation =
          m.role.name === 'OWNER'
            ? "Primary Host"
            : m.role.name === 'CO_HOST'
            ? "Co-Host"
            : m.role.name === 'PLANNER' || m.role.name === 'ORGANIZER'
            ? "Wedding Planner"
            : m.role.name === 'HOSPITALITY'
            ? "Hospitality Coordinator"
            : "Council Observer";

        return {
          id: m.id,
          weddingId: m.weddingId,
          userId: m.userId,
          status: m.status as any,
          invitedAt: m.invitedAt,
          joinedAt: m.joinedAt,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
          role: {
            id: m.role.id,
            name: m.role.name,
            description: m.role.description,
            permissions: m.role.permissions,
          },
          user: m.user,
          relation: meta.relation || defaultRelation,
          phone: meta.phone || '',
          ceremonyScope: meta.ceremonyScope || 'All Ceremonies',
          personalNote: meta.personalNote || '',
        };
      })
      .sort((a, b) => {
        const orderA = roleOrder[a.role.name] || 99;
        const orderB = roleOrder[b.role.name] || 99;
        return orderA - orderB;
      });
  }

  async inviteCollaborator(
    weddingId: string,
    email: string,
    roleName: string,
    metadata: { name?: string; phone?: string; relation?: string; ceremonyScope?: string; personalNote?: string }
  ) {
    await this.ensureDefaultRoles();
    const user = await this.findOrCreateUser(email, metadata.name);

    let role = await prisma.role.findUnique({
      where: { name: roleName.toUpperCase() },
    });
    if (!role) {
      role = (await prisma.role.findUnique({ where: { name: 'PLANNER' } })) ||
             (await prisma.role.findUnique({ where: { name: 'ORGANIZER' } })) ||
             (await prisma.role.findFirst());
    }
    if (!role) throw new Error(`Role "${roleName}" could not be resolved`);

    const member = await prisma.weddingMember.upsert({
      where: {
        weddingId_userId: {
          weddingId,
          userId: user.id,
        },
      },
      update: {
        roleId: role.id,
        status: 'INVITED',
        invitedAt: new Date(),
      },
      create: {
        weddingId,
        userId: user.id,
        roleId: role.id,
        status: 'INVITED',
        invitedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        role: true,
      },
    });

    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      select: { settings: true },
    });
    const currentSettings = (wedding?.settings as any) || {};
    const collaborators = currentSettings.collaborators || {};
    collaborators[member.id] = {
      relation: metadata.relation || '',
      phone: metadata.phone || '',
      ceremonyScope: metadata.ceremonyScope || 'All Ceremonies',
      personalNote: metadata.personalNote || '',
    };
    collaborators[user.email] = collaborators[member.id];

    await prisma.wedding.update({
      where: { id: weddingId },
      data: {
        settings: {
          ...currentSettings,
          collaborators,
        },
      },
    });

    return member;
  }

  async updateMemberRecord(
    weddingId: string,
    memberId: string,
    updateData: {
      roleName?: string;
      status?: MembershipStatus;
      relation?: string;
      phone?: string;
      ceremonyScope?: string;
    }
  ) {
    await this.ensureDefaultRoles();
    const member = await prisma.weddingMember.findUnique({
      where: { id: memberId },
      include: { role: true, user: true },
    });
    if (!member || member.weddingId !== weddingId) {
      throw new Error('Member not found in this wedding workspace');
    }

    let roleId = member.roleId;
    if (updateData.roleName) {
      const newRole = await prisma.role.findUnique({
        where: { name: updateData.roleName.toUpperCase() },
      });
      if (newRole) roleId = newRole.id;
    }

    const updated = await prisma.weddingMember.update({
      where: { id: memberId },
      data: {
        roleId,
        ...(updateData.status ? { status: updateData.status } : {}),
        ...(updateData.status === 'ACTIVE' && !member.joinedAt ? { joinedAt: new Date() } : {}),
      },
      include: {
        role: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (updateData.relation !== undefined || updateData.phone !== undefined || updateData.ceremonyScope !== undefined) {
      const wedding = await prisma.wedding.findUnique({
        where: { id: weddingId },
        select: { settings: true },
      });
      const currentSettings = (wedding?.settings as any) || {};
      const collaborators = currentSettings.collaborators || {};
      collaborators[member.id] = {
        ...(collaborators[member.id] || {}),
        ...(updateData.relation !== undefined ? { relation: updateData.relation } : {}),
        ...(updateData.phone !== undefined ? { phone: updateData.phone } : {}),
        ...(updateData.ceremonyScope !== undefined ? { ceremonyScope: updateData.ceremonyScope } : {}),
      };
      collaborators[member.user.email] = collaborators[member.id];

      await prisma.wedding.update({
        where: { id: weddingId },
        data: {
          settings: {
            ...currentSettings,
            collaborators,
          },
        },
      });
    }

    return updated;
  }

  async removeMemberRecord(weddingId: string, memberId: string) {
    const member = await prisma.weddingMember.findUnique({
      where: { id: memberId },
      include: { role: true },
    });
    if (!member || member.weddingId !== weddingId) {
      throw new Error('Member not found');
    }
    if (member.role.name === 'OWNER') {
      throw new Error('Cannot revoke or remove the workspace Sovereign Owner');
    }

    return prisma.weddingMember.delete({
      where: { id: memberId },
    });
  }

  async resendInviteRecord(weddingId: string, memberId: string) {
    const member = await prisma.weddingMember.findUnique({
      where: { id: memberId },
      include: { user: true, role: true },
    });
    if (!member || member.weddingId !== weddingId) {
      throw new Error('Member not found');
    }

    return prisma.weddingMember.update({
      where: { id: memberId },
      data: {
        invitedAt: new Date(),
        status: member.status === 'ACTIVE' ? 'ACTIVE' : 'INVITED',
      },
      include: { user: true, role: true },
    });
  }

  async acceptMemberInvitation(weddingId: string, userId: string) {
    const member = await prisma.weddingMember.findUnique({
      where: {
        weddingId_userId: {
          weddingId,
          userId,
        },
      },
    });
    if (!member) {
      throw new Error('No invitation found for this user in this wedding workspace');
    }
    return prisma.weddingMember.update({
      where: { id: member.id },
      data: {
        status: 'ACTIVE',
        joinedAt: new Date(),
      },
      include: { user: true, role: true },
    });
  }

  async getTelemetry(weddingId: string): Promise<CollaboratorTelemetry> {
    const members = await prisma.weddingMember.findMany({
      where: { weddingId, status: { not: 'REMOVED' } },
      include: { role: true },
    });

    const activeCount = members.filter((m) => m.status === 'ACTIVE').length;
    const pendingCount = members.filter((m) => m.status === 'INVITED').length;

    let hosts = 0;
    let coHosts = 0;
    let planners = 0;
    let hospitality = 0;
    let observers = 0;

    for (const m of members) {
      const r = m.role.name.toUpperCase();
      if (r === 'OWNER') hosts++;
      else if (r === 'CO_HOST') coHosts++;
      else if (r === 'PLANNER' || r === 'ORGANIZER') planners++;
      else if (r === 'HOSPITALITY' || r === 'COLLABORATOR') hospitality++;
      else if (r === 'VIEWER') observers++;
      else planners++;
    }

    return {
      activeCount,
      pendingCount,
      totalPasskeys: members.length,
      roleBreakdown: {
        hosts,
        coHosts,
        planners,
        hospitality,
        observers,
      },
      securityHealth: '100% Sovereign',
      zeroPermissionLeaks: true,
    };
  }

  async seedImperialCouncil(weddingId: string) {
    await this.ensureDefaultRoles();
    const existing = await prisma.weddingMember.findMany({
      where: { weddingId },
      include: { user: true },
    });

    const councilSeeds = [
      {
        name: "Devendra Singh Mewar",
        email: "bride-father@mewarpalace.in",
        role: "OWNER",
        relation: "Bride's Father • Chief Patron",
        ceremonyScope: "All 5 Ceremonies + Master Financials",
        status: 'ACTIVE' as MembershipStatus,
      },
      {
        name: "Ananya Sharma",
        email: "ananya@singhania-sharma.in",
        role: "CO_HOST",
        relation: "The Bride",
        ceremonyScope: "Trousseau, Ritual Schedules, Invites",
        status: 'ACTIVE' as MembershipStatus,
      },
      {
        name: "Rahul Singhania",
        email: "rahul@singhania-group.com",
        role: "CO_HOST",
        relation: "The Groom",
        ceremonyScope: "Baraat Flotilla • Sangeet Acoustics",
        status: 'ACTIVE' as MembershipStatus,
      },
      {
        name: "Muni Reddy",
        email: "muni@royaleventsindia.com",
        role: "PLANNER",
        relation: "Lead Wedding Planner • Royal Events India",
        ceremonyScope: "Timelines, Muhurat Cues, Production",
        status: 'ACTIVE' as MembershipStatus,
      },
      {
        name: "Chauhan Ji",
        email: "chauhan.leela@palaceconcierge.in",
        role: "HOSPITALITY",
        relation: "Palace Royal Liaison (The Leela Udaipur)",
        ceremonyScope: "Lake Flotilla, Luggage VIP, Room Keys",
        status: 'ACTIVE' as MembershipStatus,
      },
      {
        name: "Dr. Vikramaditya Sharma",
        email: "dr.vikram@sharmaortho.in",
        role: "VIEWER",
        relation: "Bride's Paternal Uncle (Chacha Ji)",
        ceremonyScope: "Pooja Samagri, Family Blessings Schedule",
        status: 'ACTIVE' as MembershipStatus,
      },
      {
        name: "Pooja Reddy",
        email: "pooja.reddy@decorstudio.in",
        role: "PLANNER",
        relation: "Floral & Mandap Scenographer",
        ceremonyScope: "Jagmandir Island Stage & Mandap Decor",
        status: 'INVITED' as MembershipStatus,
      },
      {
        name: "Shailesh Mehta",
        email: "smehta@royaltransfers.in",
        role: "HOSPITALITY",
        relation: "Fleet Logistics Lead • Royal Transfers",
        ceremonyScope: "Arrival manifests & Lake Catamarans sync",
        status: 'INVITED' as MembershipStatus,
      },
    ];

    const rolesMap = await prisma.role.findMany();
    const roleIdByName = Object.fromEntries(rolesMap.map((r) => [r.name, r.id]));

    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      select: { settings: true },
    });
    const currentSettings = (wedding?.settings as any) || {};
    const collaborators = currentSettings.collaborators || {};

    for (const seed of councilSeeds) {
      const alreadyMember = existing.find((m) => m.user.email.toLowerCase() === seed.email.toLowerCase());
      if (alreadyMember) continue;

      const user = await this.findOrCreateUser(seed.email, seed.name);
      const roleId = roleIdByName[seed.role] || roleIdByName['PLANNER'] || roleIdByName['ORGANIZER'];

      const member = await prisma.weddingMember.upsert({
        where: {
          weddingId_userId: {
            weddingId,
            userId: user.id,
          },
        },
        update: {
          roleId,
          status: seed.status,
          ...(seed.status === 'ACTIVE' ? { joinedAt: new Date() } : { invitedAt: new Date() }),
        },
        create: {
          weddingId,
          userId: user.id,
          roleId,
          status: seed.status,
          ...(seed.status === 'ACTIVE' ? { joinedAt: new Date() } : { invitedAt: new Date() }),
        },
      });

      collaborators[member.id] = {
        relation: seed.relation,
        phone: '+91 98290 12345',
        ceremonyScope: seed.ceremonyScope,
        personalNote: 'Imperial Vivah Council Commission',
      };
      collaborators[seed.email] = collaborators[member.id];
    }

    await prisma.wedding.update({
      where: { id: weddingId },
      data: {
        settings: {
          ...currentSettings,
          collaborators,
        },
      },
    });

    return this.getMembersWithMetadata(weddingId);
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
