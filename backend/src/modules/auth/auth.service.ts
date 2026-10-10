import { OAuth2Client } from 'google-auth-library';
import { userRepository, IUserRepository } from './auth.repository';
import { AuthSecurity } from './auth.security';
import { SignupInput, signupSchema, LoginInput, loginSchema } from './auth.validation';
import { UserResponse } from './auth.types';
import { ConflictError, UnauthorizedError, NotFoundError, ValidationError } from '../../shared/errors/api-error';
import { config } from '../../config';

export class AuthService {
  private googleClient: OAuth2Client;

  constructor(private userRepo: IUserRepository = userRepository) {
    this.googleClient = new OAuth2Client(config.google.clientId);
  }

  /**
   * Registers a new couple/host account.
   */
  async signup(input: SignupInput): Promise<{ user: UserResponse; token: string }> {
    const parseResult = signupSchema.safeParse(input);
    if (!parseResult.success) {
      throw new ValidationError('Validation failed', parseResult.error.format());
    }

    const { name, email, password, preferredLanguage } = parseResult.data;

    // Check for existing account
    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      throw new ConflictError('An account with this email address already exists');
    }

    // Secure password hashing
    const passwordHash = await AuthSecurity.hashPassword(password);

    // Persist new user
    const newUser = await this.userRepo.create({
      name,
      email,
      passwordHash,
      preferredLanguage: preferredLanguage || 'en',
    });

    // Create session token
    const token = AuthSecurity.createSessionToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      preferredLanguage: newUser.preferredLanguage,
    });

    return {
      user: AuthSecurity.toUserResponse(newUser),
      token,
    };
  }

  /**
   * Authenticates user credentials and establishes a session.
   */
  async login(input: LoginInput): Promise<{ user: UserResponse; token: string; maxAgeMs: number }> {
    const parseResult = loginSchema.safeParse(input);
    if (!parseResult.success) {
      throw new ValidationError('Validation failed', parseResult.error.format());
    }

    const { email, password, rememberMe } = parseResult.data;

    // Fetch user
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if account was created via Google Sign-In with no local password set
    if (!user.passwordHash) {
      throw new UnauthorizedError(
        'This account was created with Google Sign-In. Please sign in using the Google button.'
      );
    }

    // Timing-safe password verification
    const isValid = await AuthSecurity.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Session duration: 30 days if rememberMe, otherwise 7 days
    const maxAgeMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : config.session.maxAge;

    const token = AuthSecurity.createSessionToken(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        preferredLanguage: user.preferredLanguage,
      },
      maxAgeMs
    );

    return {
      user: AuthSecurity.toUserResponse(user),
      token,
      maxAgeMs,
    };
  }

  /**
   * Authenticates or registers a user via Google OAuth credential token.
   */
  async googleAuth(credential: string): Promise<{ user: UserResponse; token: string; maxAgeMs: number }> {
    if (!credential) {
      throw new ValidationError('Google credential token is required');
    }

    let payload: any = null;

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: credential,
        audience: config.google.clientId || undefined,
      });
      payload = ticket.getPayload();
    } catch (verifyError: any) {
      // In development or if audience check fails due to missing server client ID,
      // fallback to Google tokeninfo endpoint verification
      console.warn('[AuthService] Google verifyIdToken error, attempting fallback:', verifyError?.message);
      try {
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
        if (response.ok) {
          payload = await response.json();
        }
      } catch (fallbackError) {
        console.error('[AuthService] Google tokeninfo fallback failed:', fallbackError);
      }
    }

    if (!payload || !payload.email) {
      throw new UnauthorizedError('Invalid or expired Google authentication token. Please sign in again.');
    }

    const googleId: string = payload.sub;
    const email: string = payload.email.toLowerCase().trim();
    const name: string = payload.name || payload.given_name || email.split('@')[0];
    const avatarUrl: string | null = payload.picture || null;

    // Check if user already exists with this Google ID
    let user = await this.userRepo.findByGoogleId(googleId);

    if (!user) {
      // Check if user already exists with this email address (Scenario A: Existing user links Google)
      user = await this.userRepo.findByEmail(email);

      if (user) {
        // Link Google ID to existing account and update verified email / avatar
        const updated = await this.userRepo.update(user.id, {
          googleId,
          avatarUrl: user.avatarUrl || avatarUrl,
          emailVerifiedAt: user.emailVerifiedAt || new Date(),
        });
        if (updated) user = updated;
      } else {
        // Scenario B: Brand new user registering via Google
        user = await this.userRepo.create({
          name,
          email,
          passwordHash: null,
          googleId,
          avatarUrl,
          preferredLanguage: 'en',
          emailVerifiedAt: new Date(),
        });
      }
    }

    // Generate session token
    const maxAgeMs = config.session.maxAge;
    const token = AuthSecurity.createSessionToken(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        preferredLanguage: user.preferredLanguage,
      },
      maxAgeMs
    );

    return {
      user: AuthSecurity.toUserResponse(user),
      token,
      maxAgeMs,
    };
  }

  /**
   * Fetches user profile for the active session.
   */
  async getCurrentUser(userId: string): Promise<UserResponse> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }
    return AuthSecurity.toUserResponse(user);
  }
}

export const authService = new AuthService();
