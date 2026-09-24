import { Response, NextFunction } from "express";
import { query } from "../config/database";
import { ApiError, sendResponse } from "../utils";
import { AuthenticatedRequest } from "../types";

export const RewardsController = {
  async listar(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await query(
        `SELECT * FROM recompensas_plataforma
         WHERE estado = 'ACTIVA'
           AND (fecha_inicio IS NULL OR fecha_inicio<=CURRENT_TIMESTAMP)
           AND (fecha_fin IS NULL OR fecha_fin > CURRENT_TIMESTAMP)
         ORDER BY costo_puntos_globales ASC`,
      );
      sendResponse(res, 200, result.rows, "Catálogo de recompensas");
    } catch (error) {
      next(error);
    }
  },

  async canjear(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new ApiError(401, "No autenticado");
      const { recompensa_id } = req.body;
      if (!recompensa_id)
        throw new ApiError(400, "recompensa_id es obligatorio");

      // Transacción simple
      const client = await (await import("../config/database")).pool.connect();
      try {
        await client.query("BEGIN");

        const rec = await client.query(
          `SELECT * FROM recompensas_plataforma WHERE id = $1 FOR UPDATE`,
          [recompensa_id],
        );
        if (!rec.rows[0] || rec.rows[0].estado !== "ACTIVA") {
          throw new ApiError(404, "Recompensa no disponible");
        }
        const recompensa = rec.rows[0];
        if (
          recompensa.fecha_inicio &&
          new Date(recompensa.fecha_inicio) > new Date()
        )
          throw new ApiError(400, "La recompensa aún no está disponible");
        if (
          recompensa.fecha_fin &&
          new Date(recompensa.fecha_fin) <= new Date()
        )
          throw new ApiError(400, "Recompensa caducada");

        if (
          recompensa.stock_disponible !== null &&
          recompensa.stock_disponible <= 0
        ) {
          throw new ApiError(400, "Sin stock disponible");
        }

        const user = await client.query(
          `SELECT puntos_globales FROM usuarios WHERE id = $1 FOR UPDATE`,
          [req.user.id],
        );
        if (user.rows[0].puntos_globales < recompensa.costo_puntos_globales) {
          throw new ApiError(400, "Puntos insuficientes");
        }

        await client.query(
          `UPDATE usuarios SET puntos_globales = puntos_globales - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [recompensa.costo_puntos_globales, req.user.id],
        );

        if (recompensa.stock_disponible !== null) {
          await client.query(
            `UPDATE recompensas_plataforma SET stock_disponible = stock_disponible - 1 WHERE id = $1`,
            [recompensa_id],
          );
        }

        const canje = await client.query(
          `INSERT INTO historial_canjes (usuario_id, recompensa_id, puntos_gastados)
           VALUES ($1, $2, $3) RETURNING *`,
          [req.user.id, recompensa_id, recompensa.costo_puntos_globales],
        );

        await client.query("COMMIT");
        sendResponse(res, 200, canje.rows[0], "Canje realizado con éxito");
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
    } catch (error) {
      next(error);
    }
  },

  async misCanjes(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) throw new ApiError(401, "No autenticado");
      const result = await query(
        `SELECT c.*, r.nombre_recompensa, r.imagen_url, r.tipo_entrega
         FROM historial_canjes c
         JOIN recompensas_plataforma r ON r.id = c.recompensa_id
         WHERE c.usuario_id = $1
         ORDER BY c.fecha_canje DESC`,
        [req.user.id],
      );
      sendResponse(res, 200, result.rows, "Historial de canjes");
    } catch (error) {
      next(error);
    }
  },
};
