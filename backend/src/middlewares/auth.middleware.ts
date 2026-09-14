import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, AuthUser } from '../types';
import { ApiError } from '../utils';

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Acceso denegado: Token no proporcionado.'));
  }

  // Extraemos el token (posición 1 del split "Bearer <token>")
  const token = authHeader.split(' ')[1];

  try {
    // Verificamos y decodificamos usando la clave secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_fallback_key') as AuthUser;
    
    // Inyectamos los datos del usuario en la petición (req.user)
    // Así los controladores como PointsController pueden saber quién ejecuta la acción
    req.user = decoded;
    
    next();
  } catch (error) {
    return next(new ApiError(401, 'Token inválido o ha expirado. Por favor, inicia sesión nuevamente.'));
  }
};