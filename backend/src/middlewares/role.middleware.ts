import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { ApiError } from '../utils';

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'No autenticado.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'Permisos insuficientes para realizar esta acción.'));
    }

    next();
  };
};
