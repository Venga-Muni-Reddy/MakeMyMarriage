import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { config } from '../../config';
import { UserEntity, UserResponse, AuthTokenPayload } from './auth.types';

export class AuthSecurity {
  /**
   * Hashes a password using bcrypt with salt factor 12.
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  /**
   * Timing-safe password verification.
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Encodes an object to a URL-safe Base64 string.
   */
  private static base64UrlEncode(data: string): string {
    return Buffer.from(data)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  /**
   * Decodes a URL-safe Base64 string.
   */
  private static base64UrlDecode(data: string): string {
    let str = data.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    return Buffer.from(str, 'base64').toString('utf-8');
  }

  /**
   * Creates a signed, tamper-proof session token (HMAC-SHA256).
   */
  static createSessionToken(
    payload: Omit<AuthTokenPayload, 'iat' | 'exp'>,
    expiresInMs = config.session.maxAge
  ): string {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + Math.floor(expiresInMs / 1000);

    const fullPayload: AuthTokenPayload = {
      ...payload,
      iat: now,
      exp,
    };

    const header = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
    const encodedHeader = this.base64UrlEncode(header);
    const encodedPayload = this.base64UrlEncode(JSON.stringify(fullPayload));

    const signature = crypto
      .createHmac('sha256', config.session.secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Verifies and decodes a signed session token. Returns null if invalid or expired.
   */
  static verifySessionToken(token: string): AuthTokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [encodedHeader, encodedPayload, signature] = parts;
      const expectedSignature = crypto
        .createHmac('sha256', config.session.secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

      // Timing-safe comparison to prevent timing attacks
      if (
        signature.length !== expectedSignature.length ||
        !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
      ) {
        return null;
      }

      const payload: AuthTokenPayload = JSON.parse(this.base64UrlDecode(encodedPayload));
      const now = Math.floor(Date.now() / 1000);

      if (payload.exp && payload.exp < now) {
        return null; // Expired
      }

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Sanitizes a User entity into a safe public UserResponse object.
   * Ensures password_hash is never exposed.
   */
  static toUserResponse(user: UserEntity): UserResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      preferredLanguage: user.preferredLanguage,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
    };
  }
}
