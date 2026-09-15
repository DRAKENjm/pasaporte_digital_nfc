import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { ApiError } from '../utils';

export const requireRoles = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'No autenticado'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'No tienes permisos para esta acción'));
    }
    next();
  };
};
