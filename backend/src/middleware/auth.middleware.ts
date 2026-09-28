import { Request, Response, NextFunction } from 'express';
import { AuthSecurity } from '../modules/auth/auth.security';
import { AuthTokenPayload } from '../modules/auth/auth.types';
import { UnauthorizedError } from '../shared/errors/api-error';

// Extend Express Request declaration to include user session context
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  // 1. Check HttpOnly cookie
  let token = req.cookies?.mmm_session;

  // 2. Fallback to Authorization Bearer header
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    return next(new UnauthorizedError('Authentication required to access this resource'));
  }

  // 3. Verify cryptographic token
  const payload = AuthSecurity.verifySessionToken(token);
  if (!payload) {
    return next(new UnauthorizedError('Invalid or expired session. Please log in again'));
  }

  // 4. Attach verified session to request context
  req.user = payload;
  next();
};
