import { Response, NextFunction } from "express";
import { query } from "../config/database";
import { ApiError, sendResponse } from "../utils";
import { AuthenticatedRequest } from "../types";

export const PointsController = {
  /** Historial de visitas y sellos para el usuario actual */
  async historial(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) throw new ApiError(401, "No autenticado");
      const result = await query(
        `SELECT v.id_visita, v.fecha_hora, v.estado,
                s.nombre AS sucursal_nombre,
                e.nombre_comercial AS establecimiento_nombre,
                sd.numero_sello, sd.estado AS sello_estado,
                ps.nombre_sello, ps.color_sello
         FROM visitas v
         JOIN clientes c ON c.id_cliente = v.id_cliente
         JOIN sucursales s ON s.id_sucursal = v.id_sucursal
         JOIN establecimientos e ON e.id_establecimiento = s.id_establecimiento
         LEFT JOIN sellos_digitales sd ON sd.id_visita = v.id_visita
         LEFT JOIN programas_sellos ps ON ps.id_programa = sd.id_programa
         WHERE c.id_usuario = $1
         ORDER BY v.fecha_hora DESC
         LIMIT 50`,
        [req.user.id],
      );
      sendResponse(res, 200, result.rows, "Historial de sellos");
    } catch (error) {
      next(error);
    }
  },
};
