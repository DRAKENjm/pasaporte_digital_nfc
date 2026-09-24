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
                u.id AS amigo_id, u.nombres, u.apellidos, u.username, u.avatar_url,
                np.nombre_rango AS nivel, np.color_hex AS nivel_color
         FROM amistades a
         JOIN usuarios u ON (u.id = CASE WHEN a.usuario_solicitante_id = $1 THEN a.usuario_receptor_id ELSE a.usuario_solicitante_id END)
         LEFT JOIN niveles_pasaporte np ON np.id = u.nivel_id
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
                u.id AS solicitante_id, u.nombres, u.apellidos, u.username, u.avatar_url,
                np.nombre_rango AS nivel, np.color_hex AS nivel_color
         FROM amistades a
         JOIN usuarios u ON u.id = a.usuario_solicitante_id
         LEFT JOIN niveles_pasaporte np ON np.id = u.nivel_id
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
      const solicitanteId = req.user!.id;
      const { receptor_id } = req.body;

      if (!receptor_id) {
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
}
