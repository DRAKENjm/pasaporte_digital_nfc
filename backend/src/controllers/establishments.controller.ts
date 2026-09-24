import { Response, NextFunction } from "express";
import { query } from "../config/database";
import { ApiError, sendResponse } from "../utils";
import { AuthenticatedRequest } from "../types";

export const EstablishmentsController = {
  /** Listar establecimientos activos (descubrimiento) */
  async listar(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { categoria_id, q } = req.query;
      let sql = `
        SELECT e.*, c.nombre AS categoria_nombre
        FROM establecimientos e
        LEFT JOIN categorias_establecimiento c ON c.id = e.categoria_id
        WHERE e.estado = 'ACTIVO'
      `;
      const params: any[] = [];

      if (categoria_id) {
        params.push(categoria_id);
        sql += ` AND e.categoria_id = $${params.length}`;
      }
      if (q && String(q).trim()) {
        params.push(`%${String(q).trim()}%`);
        sql += ` AND (e.razon_social ILIKE $${params.length} OR e.direccion ILIKE $${params.length})`;
      }

      sql += " ORDER BY e.razon_social ASC";
      const result = await query(sql, params);
      sendResponse(res, 200, result.rows, "Establecimientos");
    } catch (error) {
      next(error);
    }
  },

  /** Detalle de un establecimiento + reglas activas */
  async detalle(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const est = await query(
        `SELECT e.*, c.nombre AS categoria_nombre
         FROM establecimientos e
         LEFT JOIN categorias_establecimiento c ON c.id = e.categoria_id
         WHERE e.id = $1`,
        [id],
      );
      if (!est.rows[0])
        throw new ApiError(404, "Establecimiento no encontrado");

      const reglas = await query(
        `SELECT * FROM reglas_sellos
         WHERE establecimiento_id = $1 AND estado = 'ACTIVA'
         ORDER BY created_at DESC`,
        [id],
      );

      sendResponse(
        res,
        200,
        { ...est.rows[0], reglas: reglas.rows },
        "Detalle del establecimiento",
      );
    } catch (error) {
      next(error);
    }
  },

  /** Crear establecimiento (ADMIN o COMERCIO) */
  async crear(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new ApiError(401, "No autenticado");
      const { categoria_id, ruc, razon_social, direccion } = req.body;

      if (!ruc || !razon_social) {
        throw new ApiError(400, "RUC y razón social son obligatorios");
      }

      const result = await query(
        `INSERT INTO establecimientos (categoria_id, ruc, razon_social, direccion, estado)
         VALUES ($1, $2, $3, $4, 'ACTIVO')
         RETURNING *`,
        [categoria_id || null, ruc, razon_social, direccion || null],
      );

      sendResponse(res, 201, result.rows[0], "Establecimiento creado");
    } catch (error: any) {
      if (error.code === "23505") {
        return next(
          new ApiError(409, "Ya existe un establecimiento con ese RUC"),
        );
      }
      next(error);
    }
  },

  /** Actualizar establecimiento */
  async actualizar(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) throw new ApiError(401, "No autenticado");
      const { id } = req.params;
      const { categoria_id, razon_social, direccion, estado } = req.body;
      const { lat, lng, descripcion, telefono, horario, imagen_url } = req.body;
      for (const [v, max] of [
        [lat, 90],
        [lng, 180],
      ])
        if (
          v !== undefined &&
          v !== null &&
          (typeof v !== "number" || !Number.isFinite(v) || Math.abs(v) > max)
        )
          throw new ApiError(400, "Coordenadas inválidas");

      const result = await query(
        `UPDATE establecimientos SET
           categoria_id = COALESCE($2, categoria_id),
           razon_social = COALESCE($3, razon_social),
           direccion = COALESCE($4, direccion),
           estado = COALESCE($5, estado),
           lat=COALESCE($6,lat),lng=COALESCE($7,lng),descripcion=COALESCE($8,descripcion),telefono=COALESCE($9,telefono),horario=COALESCE($10,horario),imagen_url=COALESCE($11,imagen_url)
         WHERE id = $1
         RETURNING *`,
        [
          id,
          categoria_id,
          razon_social,
          direccion,
          estado,
          lat,
          lng,
          descripcion,
          telefono,
          horario,
          imagen_url,
        ],
      );

      if (!result.rows[0])
        throw new ApiError(404, "Establecimiento no encontrado");
      sendResponse(res, 200, result.rows[0], "Establecimiento actualizado");
    } catch (error) {
      next(error);
    }
  },

  /** Categorías */
  async categorias(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await query(
        `SELECT * FROM categorias_establecimiento WHERE estado = TRUE ORDER BY nombre`,
      );
      sendResponse(res, 200, result.rows, "Categorías");
    } catch (error) {
      next(error);
    }
  },

  /** Crear / listar reglas de sellos de un establecimiento */
  async listarReglas(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const result = await query(
        `SELECT * FROM reglas_sellos WHERE establecimiento_id = $1 ORDER BY created_at DESC`,
        [id],
      );
      sendResponse(res, 200, result.rows, "Reglas de sellos");
    } catch (error) {
      next(error);
    }
  },

  async crearRegla(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) throw new ApiError(401, "No autenticado");
      const { id } = req.params; // establecimiento_id
      const {
        nombre_accion,
        valor_puntos_por_sello,
        limite_diario_por_usuario,
      } = req.body;

      if (!nombre_accion)
        throw new ApiError(400, "nombre_accion es obligatorio");

      const result = await query(
        `INSERT INTO reglas_sellos
           (establecimiento_id, nombre_accion, valor_puntos_por_sello, limite_diario_por_usuario, estado)
         VALUES ($1, $2, $3, $4, 'ACTIVA')
         RETURNING *`,
        [
          id,
          nombre_accion,
          valor_puntos_por_sello ?? 10,
          limite_diario_por_usuario ?? 1,
        ],
      );

      sendResponse(res, 201, result.rows[0], "Regla creada");
    } catch (error) {
      next(error);
    }
  },

  async actualizarRegla(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { reglaId } = req.params;
      const {
        nombre_accion,
        valor_puntos_por_sello,
        limite_diario_por_usuario,
        estado,
      } = req.body;

      const result = await query(
        `UPDATE reglas_sellos SET
           nombre_accion = COALESCE($2, nombre_accion),
           valor_puntos_por_sello = COALESCE($3, valor_puntos_por_sello),
           limite_diario_por_usuario = COALESCE($4, limite_diario_por_usuario),
           estado = COALESCE($5, estado),
           lat=COALESCE($6,lat),lng=COALESCE($7,lng),descripcion=COALESCE($8,descripcion),telefono=COALESCE($9,telefono),horario=COALESCE($10,horario),imagen_url=COALESCE($11,imagen_url)
         WHERE id = $1
         RETURNING *`,
        [
          reglaId,
          nombre_accion,
          valor_puntos_por_sello,
          limite_diario_por_usuario,
          estado,
        ],
      );

      if (!result.rows[0]) throw new ApiError(404, "Regla no encontrada");
      sendResponse(res, 200, result.rows[0], "Regla actualizada");
    } catch (error) {
      next(error);
    }
  },

  /** Vincular personal del comercio al establecimiento */
  async agregarPersonal(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) throw new ApiError(401, "No autenticado");
      const { id } = req.params; // establecimiento_id
      const { usuario_id, pin_validacion } = req.body;

      if (!usuario_id) throw new ApiError(400, "usuario_id es obligatorio");

      const result = await query(
        `INSERT INTO personal_establecimiento (usuario_id, establecimiento_id, pin_validacion, estado)
         VALUES ($1, $2, $3, TRUE)
         ON CONFLICT (usuario_id, establecimiento_id) DO UPDATE
           SET estado = TRUE, pin_validacion = COALESCE(EXCLUDED.pin_validacion, personal_establecimiento.pin_validacion)
         RETURNING *`,
        [usuario_id, id, pin_validacion || null],
      );

      sendResponse(res, 201, result.rows[0], "Personal vinculado");
    } catch (error) {
      next(error);
    }
  },

  /** Eliminar establecimiento (solo si no tiene personal vinculado) */
  async eliminar(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) throw new ApiError(401, "No autenticado");
      const { id } = req.params;

      const check = await query(
        `SELECT id FROM personal_establecimiento WHERE establecimiento_id = $1 AND estado = TRUE LIMIT 1`,
        [id],
      );
      if (check.rows[0]) {
        throw new ApiError(
          409,
          "No se puede eliminar: tiene personal vinculado. Desvincula el personal primero.",
        );
      }

      const result = await query(
        `DELETE FROM establecimientos WHERE id = $1 RETURNING id`,
        [id],
      );
      if (!result.rows[0])
        throw new ApiError(404, "Establecimiento no encontrado");

      sendResponse(res, 200, null, "Establecimiento eliminado");
    } catch (error) {
      next(error);
    }
  },

  /** Estadísticas básicas del establecimiento */
  async estadisticas(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;

      const visitas = await query(
        `SELECT COUNT(*)::int AS total_visitas,
                COALESCE(SUM(puntos_ganados), 0)::int AS puntos_entregados,
                COUNT(DISTINCT usuario_id)::int AS usuarios_unicos
         FROM historial_visitas_sellos
         WHERE establecimiento_id = $1`,
        [id],
      );

      const ultimos7 = await query(
        `SELECT DATE(fecha_hora) AS dia, COUNT(*)::int AS visitas
         FROM historial_visitas_sellos
         WHERE establecimiento_id = $1
           AND fecha_hora >= CURRENT_DATE - INTERVAL '7 days'
         GROUP BY DATE(fecha_hora)
         ORDER BY dia`,
        [id],
      );

      sendResponse(
        res,
        200,
        { resumen: visitas.rows[0], por_dia: ultimos7.rows },
        "Estadísticas del establecimiento",
      );
    } catch (error) {
      next(error);
    }
  },
};
