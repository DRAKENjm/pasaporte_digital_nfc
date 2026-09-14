import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/user.model';
import { hashPassword, comparePassword, generateToken, ApiError, sendResponse } from '../utils';
import { AuthenticatedRequest } from '../types';

export const AuthController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Recibimos los nuevos campos divididos y el nombre del rol
      const { email, password, nombres, apellidos, roleName } = req.body;

      if (!email || !password || !nombres || !apellidos) {
        throw new ApiError(400, 'Todos los campos son requeridos');
      }

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        throw new ApiError(409, 'El correo electrónico ya está registrado');
      }

      const hashedPassword = await hashPassword(password);
      
      // 2. Pasamos 'nombres' y 'apellidos'. 'CLIENTE' es el rol por defecto en el nuevo esquema
      const user = await UserModel.createUser(email, hashedPassword, nombres, apellidos, roleName || 'CLIENTE');
      
      // 3. Actualizamos los datos que se guardan dentro del Token
      const token = generateToken({ 
        id: user.id, 
        email: user.email, 
        rol: user.rol_nombre, 
        nombres: user.nombres, 
        apellidos: user.apellidos 
      });

      sendResponse(res, 201, { token, user }, 'Usuario registrado con éxito');
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

      const user = await UserModel.findByEmail(email);
      if (!user) {
        throw new ApiError(401, 'Credenciales incorrectas');
      }

      const isValid = await comparePassword(password, user.password_hash);
      if (!isValid) {
        throw new ApiError(401, 'Credenciales incorrectas');
      }

      // 4. Actualizamos el payload del Token en el login
      const token = generateToken({ 
        id: user.id, 
        email: user.email, 
        rol: user.rol_nombre, 
        nombres: user.nombres, 
        apellidos: user.apellidos 
      });

      // 5. Retornamos la estructura limpia sin avatarUrl y añadiendo los puntos/sellos
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
            puntos_globales: user.puntos_globales
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
      sendResponse(res, 200, user, 'Perfil obtenido');
    } catch (error) {
      next(error);
    }
  },
};