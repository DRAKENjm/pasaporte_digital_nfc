import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, AuthUser } from '../types';
import { ApiError } from '../utils';

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new ApiError(401, 'Token no proporcionado');
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'pasaporte_nfc_dev_secret_change_in_production'
    ) as AuthUser;

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      nombres: decoded.nombres,
      apellidos: decoded.apellidos,
    };
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token expirado'));
    }
    next(new ApiError(401, 'Token inválido'));
  }
};
