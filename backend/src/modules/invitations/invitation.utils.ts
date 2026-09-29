import crypto from 'crypto';

/**
 * Generates an unguessable cryptographic token for zero-password magic links.
 * Format: tok_<24 bytes url-safe base64>
 */
export function generateMagicToken(): string {
  const bytes = crypto.randomBytes(18);
  const raw = bytes.toString('base64url');
  return `tok_${raw}`;
}

/**
 * Computes a SHA-256 hash of the magic token for safe database storage.
 * This ensures that even if DB reads are compromised, raw tokens cannot be guessed.
 */
export function hashMagicToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}
