import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/user.model";
import {
  ApiError,
  hashPassword,
  comparePassword,
  generateToken,
  sendResponse,
} from "../utils";
import { AuthenticatedRequest } from "../types";
import { query } from "../config/database";

const failedAttemptsMap = new Map<string, number>();

export const AuthController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, nombres, apellidos, telefono, roleName } = req.body;

      if (!email || !password || !nombres || !apellidos) {
        throw new ApiError(400, "Completa todos los campos obligatorios");
      }

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !nombres.trim() ||
        !apellidos.trim()
      ) {
        throw new ApiError(400, "Datos de registro inválidos");
      }

      if (password.length < 6 || password.length > 72) {
        throw new ApiError(400, "La contraseña debe tener al menos 6 caracteres");
      }

      const existing = await UserModel.findByEmail(email.toLowerCase().trim());
      if (existing) {
        throw new ApiError(409, "El correo electrónico ya está registrado");
      }

      const hashed = await hashPassword(password);
      const user = await UserModel.createUser(
        email.toLowerCase().trim(),
        hashed,
        nombres.trim(),
        apellidos.trim(),
        roleName || "CLIENTE",
        telefono,
      );

      // Registrar auditoría
      await query(
        `INSERT INTO auditoria (id_usuario, modulo, accion, entidad, id_entidad, descripcion, ip, user_agent)
         VALUES ($1, 'USUARIOS', 'CREAR', 'usuarios', $1, 'Registro de nuevo usuario', $2, $3)`,
        [user.id_usuario, req.ip || null, req.headers["user-agent"] || null],
      );

      const token = generateToken({
        id: user.id_usuario,
        email: user.email,
        role: user.rol_nombre,
        nombres: user.nombres,
        apellidos: user.apellidos,
        id_cliente: user.id_cliente,
      });

      sendResponse(res, 201, {
        user: {
          id: user.id_usuario,
          email: user.email,
          nombres: user.nombres,
          apellidos: user.apellidos,
          role: user.rol_nombre,
          id_cliente: user.id_cliente,
          codigo_cliente: user.codigo_cliente,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const email = req.body.email || req.body.identifier;
      const { password } = req.body;

      if (!email || !password) {
        throw new ApiError(400, "Ingresa email y contraseña");
      }

      const emailLower = String(email).toLowerCase().trim();
      const user = await UserModel.findByEmail(emailLower);
      if (!user) {
        throw new ApiError(401, "Credenciales incorrectas");
      }

      if (user.estado !== 1) {
        throw new ApiError(403, "Tu cuenta no está activa o se encuentra suspendida");
      }

      const valid = await comparePassword(password, user.password_hash);
      if (!valid) {
        const attempts = (failedAttemptsMap.get(emailLower) || 0) + 1;
        failedAttemptsMap.set(emailLower, attempts);

        await query(
          `INSERT INTO auditoria (id_usuario, modulo, accion, entidad, id_entidad, descripcion, ip, user_agent)
           VALUES ($1, 'USUARIOS', 'LOGIN_FALLIDO', 'usuarios', $1, 'Intento de login con contraseña incorrecta', $2, $3)`,
          [user.id_usuario, req.ip || null, req.headers["user-agent"] || null],
        );

        if (attempts >= 3) {
          await query(`UPDATE usuarios SET estado = 0 WHERE id_usuario = $1`, [user.id_usuario]);
          failedAttemptsMap.delete(emailLower);
          throw new ApiError(403, "Cuenta bloqueada por demasiados intentos fallidos. Por favor comuníquese con el administrador.");
        }

        const remaining = 3 - attempts;
        throw new ApiError(401, `Contraseña incorrecta. Le queda${remaining === 1 ? '' : 'n'} ${remaining} intento${remaining === 1 ? '' : 's'}.`);
      }

      failedAttemptsMap.delete(emailLower);

      await UserModel.updateUltimoAcceso(user.id_usuario);

      const token = generateToken({
        id: user.id_usuario,
        email: user.email,
        role: user.rol_nombre,
        nombres: user.nombres,
        apellidos: user.apellidos,
        id_cliente: user.id_cliente,
      });

      sendResponse(res, 200, {
        user: {
          id: user.id_usuario,
          email: user.email,
          nombres: user.nombres,
          apellidos: user.apellidos,
          role: user.rol_nombre,
          id_cliente: user.id_cliente,
          codigo_cliente: user.codigo_cliente,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  },

  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await UserModel.findById(req.user!.id);
      if (!user) {
        throw new ApiError(404, "Usuario no encontrado");
      }

      // Calcular nivel según cantidad de visitas
      const visitas = user.total_visitas || 0;
      let nivelNombre = "Iniciador";
      let nivelColor = "#C5A059";
      let visitasSiguienteNivel = 5;

      if (visitas >= 15) {
        nivelNombre = "Maestro Pasaporte";
        nivelColor = "#800020";
        visitasSiguienteNivel = 30;
      } else if (visitas >= 5) {
        nivelNombre = "Explorador";
        nivelColor = "#D4AF37";
        visitasSiguienteNivel = 15;
      }

      sendResponse(res, 200, {
        id: user.id_usuario,
        email: user.email,
        nombres: user.nombres,
        apellidos: user.apellidos,
        telefono: user.telefono,
        foto_perfil: user.foto_perfil,
        role: user.rol_nombre,
        id_cliente: user.id_cliente,
        codigo_cliente: user.codigo_cliente,
        puntos_actuales: user.puntos_actuales || 0,
        total_visitas: user.total_visitas || 0,
        total_sellos: user.total_sellos || 0,
        locales_visitados: user.locales_visitados || 0,
        tarjeta_activa: user.tarjeta_activa || null,
        nivel: {
          nombre: nivelNombre,
          color: nivelColor,
          visitas_actuales: visitas,
          visitas_meta: visitasSiguienteNivel,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { nombres, apellidos, telefono, foto_perfil } = req.body;
      const result = await query(
        `UPDATE usuarios
         SET nombres = COALESCE($2, nombres),
             apellidos = COALESCE($3, apellidos),
             telefono = COALESCE($4, telefono),
             foto_perfil = COALESCE($5, foto_perfil),
             fecha_actualizacion = CURRENT_TIMESTAMP
         WHERE id_usuario = $1
         RETURNING id_usuario, nombres, apellidos, telefono, foto_perfil`,
        [req.user!.id, nombres?.trim() || null, apellidos?.trim() || null, telefono || null, foto_perfil || null],
      );
      sendResponse(res, 200, result.rows[0]);
    } catch (error) {
      next(error);
    }
  },

  
  async getPreferencias(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await query(
        `SELECT idioma, ocultar_fechas_sellos, fecha_actualizacion
         FROM preferencias_usuario WHERE id_usuario = $1`,
        [req.user!.id],
      );
      if (!result.rows[0]) {
        sendResponse(res, 200, { idioma: "es", ocultar_fechas_sellos: 0 });
        return;
      }
      sendResponse(res, 200, result.rows[0]);
    } catch (error) {
      next(error);
    }
  },

  async updatePreferencias(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { idioma, ocultar_fechas_sellos } = req.body;
      const idUsuario = req.user!.id;

      const idiomasOk = ["es", "en", "pt", "ru", "qu"];
      if (idioma !== undefined && !idiomasOk.includes(idioma)) {
        throw new ApiError(400, "Idioma no soportado");
      }

      // Upsert en preferencias_usuario
      const result = await query(
        `INSERT INTO preferencias_usuario (id_usuario, idioma, ocultar_fechas_sellos, fecha_actualizacion)
         VALUES ($1, COALESCE($2, 'es'), COALESCE($3, 0), CURRENT_TIMESTAMP)
         ON CONFLICT (id_usuario) DO UPDATE SET
           idioma = COALESCE($2, preferencias_usuario.idioma),
           ocultar_fechas_sellos = COALESCE($3, preferencias_usuario.ocultar_fechas_sellos),
           fecha_actualizacion = CURRENT_TIMESTAMP
         RETURNING id_preferencia, id_usuario, idioma, ocultar_fechas_sellos, fecha_actualizacion`,
        [
          idUsuario,
          idioma ?? null,
          ocultar_fechas_sellos === undefined || ocultar_fechas_sellos === null
            ? null
            : Number(ocultar_fechas_sellos) ? 1 : 0,
        ],
      );

      sendResponse(res, 200, result.rows[0]);
    } catch (error) {
      next(error);
    }
  },
};
