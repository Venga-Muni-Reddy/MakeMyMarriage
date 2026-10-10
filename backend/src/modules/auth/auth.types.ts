export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string | null;
  googleId?: string | null;
  avatarUrl?: string | null;
  name: string;
  preferredLanguage: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  preferredLanguage: string;
  avatarUrl?: string | null;
  googleId?: string | null;
  emailVerifiedAt?: Date | null;
  createdAt?: Date;
}

export interface GoogleAuthInput {
  credential: string;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  name: string;
  preferredLanguage: string;
  iat: number;
  exp: number;
}
