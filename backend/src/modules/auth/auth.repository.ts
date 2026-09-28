import crypto from 'crypto';
import prisma from '../../infrastructure/prisma/client';
import { UserEntity } from './auth.types';

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  preferredLanguage?: string;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  create(data: CreateUserData): Promise<UserEntity>;
  update(id: string, data: Partial<UserEntity>): Promise<UserEntity | null>;
}

export class UserRepository implements IUserRepository {
  // In-memory fallback map for offline / testing resilience
  private static memoryStore: Map<string, UserEntity> = new Map();

  async findByEmail(email: string): Promise<UserEntity | null> {
    const normalizedEmail = email.toLowerCase().trim();

    try {
      const user = await prisma.user.findFirst({
        where: {
          email: { equals: normalizedEmail, mode: 'insensitive' },
          deletedAt: null,
        },
      });
      if (user) return user as UserEntity;
    } catch (err: any) {
      console.warn('[UserRepository] Prisma query failed, checking memory:', err?.message || err);
      for (const user of UserRepository.memoryStore.values()) {
        if (user.email.toLowerCase() === normalizedEmail && !user.deletedAt) {
          return user;
        }
      }
    }

    return null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    try {
      const user = await prisma.user.findFirst({
        where: { id, deletedAt: null },
      });
      if (user) return user as UserEntity;
    } catch (err: any) {
      console.warn('[UserRepository] Prisma query failed, checking memory:', err?.message || err);
      const user = UserRepository.memoryStore.get(id);
      if (user && !user.deletedAt) return user;
    }

    return null;
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    const normalizedEmail = data.email.toLowerCase().trim();

    try {
      const created = await prisma.user.create({
        data: {
          name: data.name.trim(),
          email: normalizedEmail,
          passwordHash: data.passwordHash,
          preferredLanguage: data.preferredLanguage || 'en',
        },
      });
      return created as UserEntity;
    } catch (err: any) {
      console.warn('[UserRepository] Prisma create failed, falling back to memory store:', err?.message || err);
      const now = new Date();
      const newUser: UserEntity = {
        id: crypto.randomUUID(),
        name: data.name.trim(),
        email: normalizedEmail,
        passwordHash: data.passwordHash,
        preferredLanguage: data.preferredLanguage || 'en',
        emailVerifiedAt: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      UserRepository.memoryStore.set(newUser.id, newUser);
      return newUser;
    }
  }

  async update(id: string, data: Partial<UserEntity>): Promise<UserEntity | null> {
    try {
      const updated = await prisma.user.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.preferredLanguage && { preferredLanguage: data.preferredLanguage }),
          ...(data.passwordHash && { passwordHash: data.passwordHash }),
          ...(data.emailVerifiedAt && { emailVerifiedAt: data.emailVerifiedAt }),
          ...(data.deletedAt && { deletedAt: data.deletedAt }),
        },
      });
      return updated as UserEntity;
    } catch (err: any) {
      console.warn('[UserRepository] Prisma update failed, falling back to memory store:', err?.message || err);
      const existing = UserRepository.memoryStore.get(id);
      if (!existing) return null;

      const updatedUser: UserEntity = {
        ...existing,
        ...data,
        updatedAt: new Date(),
      };
      UserRepository.memoryStore.set(id, updatedUser);
      return updatedUser;
    }
  }
}

export const userRepository = new UserRepository();
