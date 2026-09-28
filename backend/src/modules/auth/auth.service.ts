import { userRepository, IUserRepository } from './auth.repository';
import { AuthSecurity } from './auth.security';
import { SignupInput, signupSchema, LoginInput, loginSchema } from './auth.validation';
import { UserResponse } from './auth.types';
import { ConflictError, UnauthorizedError, NotFoundError, ValidationError } from '../../shared/errors/api-error';
import { config } from '../../config';

export class AuthService {
  constructor(private userRepo: IUserRepository = userRepository) {}

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
