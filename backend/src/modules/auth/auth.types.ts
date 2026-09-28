export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string;
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
  emailVerifiedAt?: Date | null;
  createdAt?: Date;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  name: string;
  preferredLanguage: string;
  iat: number;
  exp: number;
}
