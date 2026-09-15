import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { EmailService } from '../services/email.service';
import { UserModel } from '../models/user.model';
import {
  ApiError,
  hashPassword,
  comparePassword,
  generateToken,
  sendResponse,
} from '../utils';
import { AuthenticatedRequest } from '../types';

export const AuthController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, nombres, apellidos, roleName } = req.body;

      if (!email || !password || !nombres || !apellidos) {
        throw new ApiError(400, 'Completa todos los campos obligatorios');
      }

      if (password.length < 6) {
        throw new ApiError(400, 'La contraseña debe tener al menos 6 caracteres');
      }

      const existing = await UserModel.findByEmail(email.toLowerCase().trim());
      if (existing) {
        throw new ApiError(409, 'El correo electrónico ya está registrado');
      }

      const hashed = await hashPassword(password);
      const user = await UserModel.createUser(
        email.toLowerCase().trim(),
        hashed,
        nombres.trim(),
        apellidos.trim(),
        roleName || 'CLIENTE'
      );

      const verifyToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'pasaporte_nfc_dev_secret_change_in_production',
        { expiresIn: '1d' }
      );
      await EmailService.sendVerificationEmail(user.email, verifyToken);

      sendResponse(
        res,
        201,
        null,
        'Usuario registrado con éxito. Por favor, revisa tu correo electrónico para verificar tu cuenta.'
      );
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new ApiError(400, 'Ingresa correo y contraseña');
      }

      const user = await UserModel.findByEmail(email.toLowerCase().trim());
      if (!user || user.estado === 'BLOQUEADO') {
        throw new ApiError(401, 'Credenciales incorrectas');
      }

      const valid = await comparePassword(password, user.password_hash);
      if (!valid) {
        throw new ApiError(401, 'Credenciales incorrectas');
      }

      if (user.email_verificado === false) {
        throw new ApiError(401, 'Por favor, verifica tu correo electrónico para poder iniciar sesión.');
      }

      // Enviar notificación de seguridad
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Desconocida';
      const device = req.headers['user-agent'] || 'Desconocido';
      EmailService.sendLoginNotification(user.email, ip as string, device).catch(e => console.error(e));

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.rol_nombre,
        nombres: user.nombres,
        apellidos: user.apellidos,
      });

      sendResponse(
        res,
        200,
        {
          token,
          user: {
            id: user.id,
            email: user.email,
            nombres: user.nombres,
            apellidos: user.apellidos,
            rol: user.rol_nombre,
            total_sellos: user.total_sellos,
            puntos_globales: user.puntos_globales,
            nivel: user.nivel_nombre,
          },
        },
        'Sesión iniciada'
      );
    } catch (error) {
      next(error);
    }
  },

  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new ApiError(401, 'No autenticado');
      const user = await UserModel.findById(req.user.id);
      if (!user) throw new ApiError(404, 'Usuario no encontrado');
      sendResponse(res, 200, user, 'Perfil obtenido');
    } catch (error) {
      next(error);
    }
  },

  async googleLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { credential, idToken } = req.body;
      const tokenToVerify = credential || idToken;

      if (!tokenToVerify) {
        throw new ApiError(400, 'Token de Google (credential) es requerido');
      }

      // Verificación real del token de Google
      const { verifyGoogleIdToken } = await import('../services/googleAuth.service');
      const profile = await verifyGoogleIdToken(tokenToVerify);

      const cleanEmail = profile.email.toLowerCase().trim();
      const isAdminAccount = cleanEmail === 'cuentaunicaapk@gmail.com';
      const assignedRole = isAdminAccount ? 'ADMIN' : 'CLIENTE';

      let user = await UserModel.findByEmail(cleanEmail);

      if (!user) {
        const dummyHash = await hashPassword(`google_oauth_${Date.now()}_${Math.random()}`);
        user = await UserModel.createUser(
          cleanEmail,
          dummyHash,
          profile.nombres.trim(),
          profile.apellidos.trim(),
          assignedRole
        );
        await UserModel.verifyEmail(user.id);
        user.email_verificado = true;
      }

      if (isAdminAccount && user.rol_nombre !== 'ADMIN') {
        const { query } = await import('../config/database');
        const roleRes = await query('SELECT id FROM roles WHERE nombre = $1', ['ADMIN']);
        if (roleRes.rows.length > 0) {
          await query('UPDATE usuarios SET rol_id = $1 WHERE id = $2', [roleRes.rows[0].id, user.id]);
          user.rol_nombre = 'ADMIN';
        }
      }

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.rol_nombre || assignedRole,
        nombres: user.nombres,
        apellidos: user.apellidos,
      });

      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Desconocida';
      const device = req.headers['user-agent'] || 'Desconocido';
      EmailService.sendLoginNotification(user.email, ip as string, device).catch((e) =>
        console.error(e)
      );

      sendResponse(
        res,
        200,
        {
          token,
          user: {
            id: user.id,
            email: user.email,
            nombres: user.nombres,
            apellidos: user.apellidos,
            rol: user.rol_nombre || assignedRole,
            total_sellos: user.total_sellos,
            puntos_globales: user.puntos_globales,
            nivel: user.nivel_nombre,
          },
        },
        'Sesión iniciada con Google'
      );
    } catch (error) {
      next(error);
    }
  },

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      if (!token) throw new ApiError(400, 'Token de verificación requerido');
      
      const secret = process.env.JWT_SECRET || 'pasaporte_nfc_dev_secret_change_in_production';
      let decoded: any;
      try {
        decoded = jwt.verify(token, secret);
      } catch (err) {
        throw new ApiError(401, 'Token de verificación inválido o expirado');
      }

      const user = await UserModel.verifyEmail(decoded.id);
      if (!user) throw new ApiError(404, 'Usuario no encontrado');

      sendResponse(res, 200, null, 'Correo electrónico verificado con éxito. Ya puedes iniciar sesión.');
    } catch (error) {
      next(error);
    }
  },
};