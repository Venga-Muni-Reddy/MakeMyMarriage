import { Request, Response, NextFunction } from 'express';
import { weddingRepository } from '../modules/weddings/wedding.repository';
import { ForbiddenError, NotFoundError } from '../shared/errors/api-error';

declare global {
  namespace Express {
    interface Request {
      weddingMember?: {
        weddingId: string;
        roleName: string;
      };
    }
  }
}

export const requireWeddingMember = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const weddingId = req.params.weddingId || req.body.weddingId;
  const userId = req.user?.userId;

  if (!weddingId) {
    return next(new NotFoundError('Wedding identifier is required'));
  }

  if (!userId) {
    return next(new ForbiddenError('Authentication required'));
  }

  try {
    const membership = await weddingRepository.findMembership(weddingId, userId);
    if (!membership || membership.status !== 'ACTIVE') {
      return next(new ForbiddenError('You do not have access to this wedding workspace'));
    }

    req.weddingMember = {
      weddingId,
      roleName: membership.role.name,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const requireWeddingRole = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.weddingMember) {
      return next(new ForbiddenError('Wedding membership required'));
    }

    if (!allowedRoles.includes(req.weddingMember.roleName)) {
      return next(
        new ForbiddenError(
          `Insufficient permissions. Requires one of: ${allowedRoles.join(', ')}`
        )
      );
    }

    next();
  };
};
