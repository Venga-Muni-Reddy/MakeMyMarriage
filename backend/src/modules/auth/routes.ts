import { Router, Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { requireAuth } from '../../middleware/auth.middleware';
import { ApiResponse } from '../../shared/response/api-response';
import { config } from '../../config';

export const authRouter = Router();

/**
 * @openapi
 * /api/v1/auth/signup:
 *   post:
 *     summary: Register a new couple or host workspace account
 *     tags: [Authentication]
 */
authRouter.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user, token } = await authService.signup(req.body);

    // Set secure HttpOnly session cookie
    res.cookie('mmm_session', token, {
      httpOnly: true,
      secure: config.session.cookieSecure,
      sameSite: config.session.cookieSecure ? 'none' : 'lax',
      path: '/',
      maxAge: config.session.maxAge,
    });

    return ApiResponse.created(res, { user, token }, 'Account created successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Sign in with email and password
 *     tags: [Authentication]
 */
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user, token, maxAgeMs } = await authService.login(req.body);

    // Set secure HttpOnly session cookie
    res.cookie('mmm_session', token, {
      httpOnly: true,
      secure: config.session.cookieSecure,
      sameSite: config.session.cookieSecure ? 'none' : 'lax',
      path: '/',
      maxAge: maxAgeMs,
    });

    return ApiResponse.success(res, {
      data: { user, token },
      message: 'Login successful',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/auth/google:
 *   post:
 *     summary: Authenticate or register with Google OAuth credential
 *     tags: [Authentication]
 */
authRouter.post('/google', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { credential } = req.body;
    const { user, token, maxAgeMs } = await authService.googleAuth(credential);

    // Set secure HttpOnly session cookie
    res.cookie('mmm_session', token, {
      httpOnly: true,
      secure: config.session.cookieSecure,
      sameSite: config.session.cookieSecure ? 'none' : 'lax',
      path: '/',
      maxAge: maxAgeMs,
    });

    return ApiResponse.success(res, {
      data: { user, token },
      message: 'Google authentication successful',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     summary: Invalidate session and clear auth cookies
 *     tags: [Authentication]
 */
authRouter.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('mmm_session', {
    httpOnly: true,
    secure: config.session.cookieSecure,
    sameSite: config.session.cookieSecure ? 'none' : 'lax',
    path: '/',
  });

  return ApiResponse.success(res, {
    data: null,
    message: 'Logged out successfully',
  });
});

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     summary: Fetch current authenticated user profile
 *     tags: [Authentication]
 */
authRouter.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getCurrentUser(req.user!.userId);
    return ApiResponse.success(res, {
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});
