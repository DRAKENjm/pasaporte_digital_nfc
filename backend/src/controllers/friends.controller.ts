import { Response, NextFunction } from "express";
import { query } from "../config/database";
import { ApiError, sendResponse } from "../utils";
import { AuthRequest } from "../types";

const MAX_AMIGOS_PERMITIDOS = 50;

export class FriendsController {
  // 1. Listar amigos aceptados del usuario actual
  static async listarAmigos(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const result = await query(
        `SELECT a.id AS amistad_id, a.created_at AS amigos_desde,
                u.id_usuario AS amigo_id, u.nombres, u.apellidos, u.foto_perfil AS avatar_url,
                c.id_cliente, c.codigo_cliente,
                (
                  SELECT COALESCE(SUM(cantidad), 0)::int
                  FROM movimientos_puntos
                  WHERE id_cliente = c.id_cliente
                ) AS puntos_actuales,
                (
                  SELECT COUNT(DISTINCT id_sucursal)::int
                  FROM visitas
                  WHERE id_cliente = c.id_cliente AND estado = 'CONFIRMADA'
                ) AS locales_visitados,
                (
                  SELECT COUNT(*)::int
                  FROM sellos_digitales s
                  JOIN visitas v ON v.id_visita = s.id_visita
                  WHERE v.id_cliente = c.id_cliente AND s.estado = 'OTORGADO'
                ) AS total_sellos
         FROM amistades a
         JOIN usuarios u ON (u.id_usuario = CASE WHEN a.usuario_solicitante_id = $1 THEN a.usuario_receptor_id ELSE a.usuario_solicitante_id END)
         LEFT JOIN clientes c ON c.id_usuario = u.id_usuario
         WHERE (a.usuario_solicitante_id = $1 OR a.usuario_receptor_id = $1)
           AND a.estado = 'ACEPTADA'
         ORDER BY a.updated_at DESC`,
        [userId],
      );

      return sendResponse(res, 200, {
        amigos: result.rows,
        total: result.rows.length,
        limite_maximo: MAX_AMIGOS_PERMITIDOS,
      });
    } catch (error) {
      next(error);
    }
  }

  // 2. Listar solicitudes pendientes recibidas
  static async listarSolicitudesPendientes(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user!.id;

      const result = await query(
        `SELECT a.id AS solicitud_id, a.created_at,
                u.id_usuario AS solicitante_id, u.nombres, u.apellidos, u.foto_perfil AS avatar_url,
                c.codigo_cliente
         FROM amistades a
         JOIN usuarios u ON u.id_usuario = a.usuario_solicitante_id
         LEFT JOIN clientes c ON c.id_usuario = u.id_usuario
         WHERE a.usuario_receptor_id = $1 AND a.estado = 'PENDIENTE'
         ORDER BY a.created_at DESC`,
        [userId],
      );

      return sendResponse(res, 200, result.rows);
    } catch (error) {
      next(error);
    }
  }

  // 3. Enviar solicitud de amistad
  static async enviarSolicitud(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const solicitanteId = Number(req.user!.id);
      const receptor_id = Number(req.body.receptor_id);

      if (!receptor_id || isNaN(receptor_id)) {
        throw new ApiError(400, "Debe especificar el usuario destinatario.");
      }

      if (solicitanteId === receptor_id) {
        throw new ApiError(400, "No puedes agregarte a ti mismo como amigo.");
      }

      // Validar si el solicitante ya alcanzó el límite de amigos
      const countAmigos = await query(
        `SELECT COUNT(*) as total FROM amistades
         WHERE (usuario_solicitante_id = $1 OR usuario_receptor_id = $1)
           AND estado = 'ACEPTADA'`,
        [solicitanteId],
      );

      if (parseInt(countAmigos.rows[0].total, 10) >= MAX_AMIGOS_PERMITIDOS) {
        throw new ApiError(
          400,
          `Has alcanzado el límite máximo de ${MAX_AMIGOS_PERMITIDOS} amigos en tu pasaporte.`,
        );
      }

      // Verificar si ya existe una relación previa
      const existing = await query(
        `SELECT * FROM amistades
         WHERE (usuario_solicitante_id = $1 AND usuario_receptor_id = $2)
            OR (usuario_solicitante_id = $2 AND usuario_receptor_id = $1)`,
        [solicitanteId, receptor_id],
      );

      if (existing.rows.length > 0) {
        const relacion = existing.rows[0];
        if (relacion.estado === "ACEPTADA") {
          throw new ApiError(400, "Ya son amigos.");
        }
        if (relacion.estado === "PENDIENTE") {
          throw new ApiError(400, "Ya existe una solicitud pendiente.");
        }
        if (relacion.estado === "BLOQUEADO") {
          throw new ApiError(403, "No es posible interactuar con este usuario.");
        }
      }

      const insertResult = await query(
        `INSERT INTO amistades (usuario_solicitante_id, usuario_receptor_id, estado)
         VALUES ($1, $2, 'PENDIENTE')
         RETURNING *`,
        [solicitanteId, receptor_id],
      );

      return sendResponse(
        res,
        201,
        insertResult.rows[0],
        "Solicitud de amistad enviada con éxito.",
      );
    } catch (error) {
      next(error);
    }
  }

  // 4. Responder solicitud (ACEPTAR / RECHAZAR)
  static async responderSolicitud(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user!.id;
      const { id } = req.params; // solicitud id
      const { accion } = req.body; // 'ACEPTAR' | 'RECHAZAR'

      if (!["ACEPTAR", "RECHAZAR"].includes(accion)) {
        throw new ApiError(400, "Acción no válida. Use ACEPTAR o RECHAZAR.");
      }

      const solicitud = await query(
        `SELECT * FROM amistades WHERE id = $1 AND usuario_receptor_id = $2 AND estado = 'PENDIENTE'`,
        [id, userId],
      );

      if (solicitud.rows.length === 0) {
        throw new ApiError(404, "Solicitud pendiente no encontrada.");
      }

      if (accion === "ACEPTAR") {
        // Validar límite de amigos del receptor
        const countReceptor = await query(
          `SELECT COUNT(*) as total FROM amistades
           WHERE (usuario_solicitante_id = $1 OR usuario_receptor_id = $1)
             AND estado = 'ACEPTADA'`,
          [userId],
        );

        if (parseInt(countReceptor.rows[0].total, 10) >= MAX_AMIGOS_PERMITIDOS) {
          throw new ApiError(
            400,
            `Has alcanzado el límite máximo de ${MAX_AMIGOS_PERMITIDOS} amigos.`,
          );
        }

        const updated = await query(
          `UPDATE amistades SET estado = 'ACEPTADA', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
          [id],
        );

        return sendResponse(res, 200, updated.rows[0], "Solicitud de amistad aceptada.");
      } else {
        await query(`DELETE FROM amistades WHERE id = $1`, [id]);
        return sendResponse(res, 200, null, "Solicitud de amistad rechazada.");
      }
    } catch (error) {
      next(error);
    }
  }

  // 5. Eliminar amigo
  static async eliminarAmigo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { amigo_id } = req.params;

      const deleted = await query(
        `DELETE FROM amistades
         WHERE ((usuario_solicitante_id = $1 AND usuario_receptor_id = $2)
             OR (usuario_solicitante_id = $2 AND usuario_receptor_id = $1))
           AND estado = 'ACEPTADA'
         RETURNING id`,
        [userId, amigo_id],
      );

      if (deleted.rows.length === 0) {
        throw new ApiError(404, "No existe conexión de amistad activa con este usuario.");
      }

      return sendResponse(res, 200, null, "Amigo eliminado de tu lista.");
    } catch (error) {
      next(error);
    }
  }

  static async generarInvitacion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const reqOrigin = req.get("origin") || req.get("referer");
      let cleanOrigin = "http://localhost:5173";
      if (reqOrigin) {
        try {
          const parsed = new URL(reqOrigin);
          cleanOrigin = parsed.origin;
        } catch {
          cleanOrigin = reqOrigin.replace(/\/+$/, "");
        }
      } else if (process.env.FRONTEND_URL) {
        cleanOrigin = process.env.FRONTEND_URL.replace(/\/+$/, "");
      } else if (process.env.CLIENT_ORIGIN) {
        cleanOrigin = process.env.CLIENT_ORIGIN.replace(/\/+$/, "");
      }

      // Reutilizar código activo del usuario si existe
      const existing = await query(
        `SELECT codigo, link_completo FROM invitaciones
         WHERE id_usuario_invitador = $1 AND estado = 1
           AND (fecha_expiracion IS NULL OR fecha_expiracion > CURRENT_TIMESTAMP)
         ORDER BY fecha_creacion DESC LIMIT 1`,
        [userId],
      );
      if (existing.rows[0]) {
        const codigoExistente = existing.rows[0].codigo;
        const linkActualizado = `${cleanOrigin}/auth/register?ref=${codigoExistente}`;
        return sendResponse(res, 200, {
          codigo: codigoExistente,
          link: linkActualizado,
        });
      }

      let codigo = "";
      try {
        const gen = await query(`SELECT public.generar_codigo_invitacion() AS codigo`);
        codigo = gen.rows[0]?.codigo || Math.random().toString(36).slice(2, 10).toUpperCase();
      } catch {
        codigo = "PD" + Math.random().toString(36).slice(2, 8).toUpperCase();
      }
      
      const link = `${cleanOrigin}/auth/register?ref=${codigo}`;
      await query(
        `INSERT INTO invitaciones (id_usuario_invitador, codigo, link_completo, estado)
         VALUES ($1, $2, $3, 1)`,
        [userId, codigo, link],
      );
      return sendResponse(res, 200, { codigo, link });
    } catch (error) {
      next(error);
    }
  }

  // 6. Buscar usuarios para agregar (por nombre, código de cliente o ID)
  static async buscarUsuarios(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user!.id);
      const rawQ = String(req.query.q || "").trim();

      if (!rawQ || rawQ.length < 1) {
        return sendResponse(res, 200, []);
      }

      // Limpieza exhaustiva de la consulta de búsqueda:
      // Maneja: "#14", "ID: #14", "ID 14", "CLI-123456", "cli123456", "14"
      const cleanQ = rawQ.replace(/^(id:?\s*#?|#)/i, "").trim();
      const digitsOnly = rawQ.replace(/\D/g, ""); // Extrae sólo dígitos si los hay
      const searchTerm = `%${cleanQ}%`;
      const searchNormalized = `%${cleanQ.replace(/[\s-_]/g, "")}%`;

      const result = await query(
        `SELECT u.id_usuario, u.nombres, u.apellidos, u.foto_perfil, u.email,
                c.id_cliente,
                COALESCE(c.codigo_cliente, 'CLI-' || LPAD(u.id_usuario::text, 6, '0')) AS codigo_cliente,
                (
                  SELECT estado FROM amistades
                  WHERE (usuario_solicitante_id = $1 AND usuario_receptor_id = u.id_usuario)
                     OR (usuario_solicitante_id = u.id_usuario AND usuario_receptor_id = $1)
                  LIMIT 1
                ) AS relacion_estado
         FROM usuarios u
         LEFT JOIN clientes c ON c.id_usuario = u.id_usuario
         WHERE u.id_usuario != $1
           AND (u.estado = 1 OR u.estado::text = '1' OR u.estado::text = 'ACTIVO')
           AND (
             -- Búsqueda por nombres / apellidos (robusto ante NULL en apellidos)
             CONCAT(COALESCE(u.nombres, ''), ' ', COALESCE(u.apellidos, '')) ILIKE $2
             OR u.nombres ILIKE $2
             OR COALESCE(u.apellidos, '') ILIKE $2
             OR u.email ILIKE $2
             -- Búsqueda por código de cliente con y sin guiones
             OR UPPER(COALESCE(c.codigo_cliente, '')) ILIKE UPPER($2)
             OR REPLACE(REPLACE(UPPER(COALESCE(c.codigo_cliente, '')), '-', ''), ' ', '') ILIKE UPPER($3)
             -- Búsqueda por ID de usuario
             OR u.id_usuario::text = $4
             -- Búsqueda por ID de cliente
             OR c.id_cliente::text = $4
             -- Si el usuario buscó "CLI-14" o "ID: #14", digitsOnly será "14"
             OR ($5 <> '' AND (u.id_usuario::text = $5 OR c.id_cliente::text = $5))
             -- Coincidencia con código de cliente generado dinámico tipo CLI-{id}
             OR ('CLI-' || u.id_usuario::text) ILIKE UPPER($2)
             OR ('CLI-' || LPAD(u.id_usuario::text, 6, '0')) ILIKE UPPER($2)
           )
         LIMIT 25`,
        [userId, searchTerm, searchNormalized, cleanQ, digitsOnly],
      );

      return sendResponse(res, 200, result.rows);
    } catch (error) {
      next(error);
    }
  }
}

