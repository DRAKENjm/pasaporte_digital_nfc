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
import { verifyGoogleIdToken } from "../services/googleAuth.service";

const failedAttemptsMap = new Map<string, number>();

export const AuthController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, nombres, apellidos, telefono, roleName, uid_nfc, codigo_invitacion, ref } = req.body;
      const refCode = (codigo_invitacion || ref || "").toString().trim().toUpperCase();

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

      const rolFinal = roleName || "CLIENTE";

      // Si se proporcionó una tarjeta NFC física, verificar disponibilidad en almacén
      let tarjetaAAsignar: any = null;
      if (uid_nfc && String(uid_nfc).trim()) {
        const cleanUid = String(uid_nfc).trim().toUpperCase();
        const tarjetaRes = await query(
          `SELECT id_tarjeta, uid_nfc, estado, id_cliente
           FROM tarjetas_nfc
           WHERE (uid_nfc = $1 OR codigo_interno = $1 OR qr_respaldo = $1)`,
          [cleanUid],
        );

        if (!tarjetaRes.rows[0]) {
          throw new ApiError(
            400,
            "La tarjeta NFC o código ingresado no existe en el inventario oficial. Por favor adquiere una tarjeta física autorizada.",
          );
        }

        if (tarjetaRes.rows[0].estado !== "DISPONIBLE" && tarjetaRes.rows[0].estado !== "EN_STOCK") {
          throw new ApiError(
            400,
            `Esta tarjeta física ya fue activada o no está disponible (Estado: ${tarjetaRes.rows[0].estado}). Si es tuya, inicia sesión con tu cuenta.`,
          );
        }

        tarjetaAAsignar = tarjetaRes.rows[0];
      }

      const hashed = await hashPassword(password);
      const user = await UserModel.createUser(
        email.toLowerCase().trim(),
        hashed,
        nombres.trim(),
        apellidos.trim(),
        rolFinal,
        telefono,
      );

      // Vincular tarjeta física si fue provista
      if (tarjetaAAsignar && user.id_cliente) {
        await query(
          `UPDATE tarjetas_nfc
           SET id_cliente = $1, estado = 'ACTIVA', fecha_asignacion = CURRENT_TIMESTAMP, fecha_activacion = CURRENT_TIMESTAMP
           WHERE id_tarjeta = $2`,
          [user.id_cliente, tarjetaAAsignar.id_tarjeta],
        );
      }

      // Procesar código de referido / invitación y otorgar puntos
      if (refCode && user.id_cliente) {
        try {
          const invRes = await query(
            `SELECT i.id_invitacion, i.id_usuario_invitador, c.id_cliente AS id_cliente_invitador
             FROM invitaciones i
             LEFT JOIN clientes c ON c.id_usuario = i.id_usuario_invitador
             WHERE UPPER(i.codigo) = $1 AND i.estado = 1
               AND (i.fecha_expiracion IS NULL OR i.fecha_expiracion > CURRENT_TIMESTAMP)
             LIMIT 1`,
            [refCode],
          );
          if (invRes.rows[0]) {
            const inv = invRes.rows[0];
            const PUNTOS_BONO = 50;

            // 1. Bono al nuevo usuario
            await query(
              `INSERT INTO movimientos_puntos (id_cliente, tipo_movimiento, cantidad, saldo_resultante, concepto, metadata)
               VALUES (
                 $1, 'BONO', $2,
                 (COALESCE((SELECT saldo_puntos FROM clientes WHERE id_cliente = $1), 0) + $2),
                 'Bono de bienvenida por invitación',
                 $3::jsonb
               )`,
              [user.id_cliente, PUNTOS_BONO, JSON.stringify({ codigo_invitacion: refCode })],
            );
            await query(
              `UPDATE clientes SET saldo_puntos = COALESCE(saldo_puntos, 0) + $1 WHERE id_cliente = $2`,
              [PUNTOS_BONO, user.id_cliente],
            );

            // 2. Bono al invitador (si tiene perfil de cliente)
            if (inv.id_cliente_invitador) {
              await query(
                `INSERT INTO movimientos_puntos (id_cliente, tipo_movimiento, cantidad, saldo_resultante, concepto, metadata)
                 VALUES (
                   $1, 'BONO', $2,
                   (COALESCE((SELECT saldo_puntos FROM clientes WHERE id_cliente = $1), 0) + $2),
                   'Recompensa por amigo invitado',
                   $3::jsonb
                 )`,
                [inv.id_cliente_invitador, PUNTOS_BONO, JSON.stringify({ amigo_id_usuario: user.id_usuario })],
              );
              await query(
                `UPDATE clientes SET saldo_puntos = COALESCE(saldo_puntos, 0) + $1 WHERE id_cliente = $2`,
                [PUNTOS_BONO, inv.id_cliente_invitador],
              );
            }

            // 3. Crear amistad mutua automática
            if (inv.id_usuario_invitador && inv.id_usuario_invitador !== user.id_usuario) {
              await query(
                `INSERT INTO amistades (usuario_solicitante_id, usuario_receptor_id, estado)
                 VALUES ($1, $2, 'ACEPTADA')
                 ON CONFLICT DO NOTHING`,
                [inv.id_usuario_invitador, user.id_usuario],
              );
            }
          }
        } catch (e) {
          console.error("Error al procesar bono de invitación:", e);
        }
      }

      // Registrar auditoría
      await query(
        `INSERT INTO auditoria (id_usuario, modulo, accion, entidad, id_entidad, descripcion, ip, user_agent)
         VALUES ($1, 'USUARIOS', 'CREAR', 'usuarios', $1, $2, $3, $4)`,
        [
          user.id_usuario,
          tarjetaAAsignar
            ? `Registro de nuevo usuario con tarjeta NFC ${tarjetaAAsignar.uid_nfc}`
            : "Registro de nuevo usuario con credencial digital",
          req.ip || null,
          req.headers["user-agent"] || null,
        ],
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

  async loginWithGoogle(req: Request, res: Response, next: NextFunction) {
    try {
      const { credential } = req.body;
      if (!credential) {
        throw new ApiError(400, "Credencial de Google no proporcionada");
      }

      // 1. Validación de Identidad con Google OAuth 2.0 y obtención de email verificado
      const googleProfile = await verifyGoogleIdToken(credential);
      const email = googleProfile.email.toLowerCase().trim();

      // 2. Consulta en Base de Datos: verificar si el usuario ya existe
      const user = await UserModel.findByEmail(email);

      // Bifurcación: Si NO existe, denegar acceso estricto y no crear cuenta vacía
      if (!user) {
        throw new ApiError(
          404,
          `El correo (${email}) no está registrado en nuestro sistema. Para acceder o vincular una tarjeta NFC, debes crear una cuenta primero.`
        );
      }

      // Si existe pero está inactivo o suspendido
      if (user.estado !== 1) {
        throw new ApiError(403, "Tu cuenta no está activa o se encuentra suspendida");
      }

      // 3. Si SÍ existe: actualizar último acceso
      await UserModel.updateUltimoAcceso(user.id_usuario);

      // Si no tenía foto de perfil y Google la provee, guardarla
      if (!user.foto_perfil && googleProfile.picture) {
        await query(
          `UPDATE usuarios SET foto_perfil = $1 WHERE id_usuario = $2`,
          [googleProfile.picture, user.id_usuario]
        ).catch(() => {});
      }

      await query(
        `INSERT INTO auditoria (id_usuario, modulo, accion, entidad, id_entidad, descripcion, ip, user_agent)
         VALUES ($1, 'AUTH', 'LOGIN_GOOGLE', 'usuarios', $1, 'Inicio de sesión con Google OAuth 2.0', $2, $3)`,
        [user.id_usuario, req.ip || null, req.headers["user-agent"] || null],
      ).catch(() => {});

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
          telefono: user.telefono,
          foto_perfil: user.foto_perfil || googleProfile.picture || null,
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
        puntos_historicos: user.puntos_historicos || 0,
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
