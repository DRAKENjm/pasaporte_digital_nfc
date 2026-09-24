import { Request, Response, NextFunction } from "express";
import { query } from "../config/database";
import { ApiError, sendResponse } from "../utils";
import { AuthRequest } from "../types";

export class ClaimsController {
  // 1. Registrar nuevo reclamo o queja (Público o Cliente Autenticado)
  static async registrar(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const usuario_id = authReq.user?.id || null;

      const {
        establecimiento_id,
        nombres_reclamante,
        apellidos_reclamante,
        tipo_documento = "DNI",
        numero_documento,
        email,
        telefono,
        direccion,
        tipo_bien_contratado = "SERVICIO",
        tipo_registro = "RECLAMO",
        monto_reclamado = 0.0,
        detalle,
        pedido_consumidor,
      } = req.body;

      if (
        !nombres_reclamante ||
        !apellidos_reclamante ||
        !numero_documento ||
        !email ||
        !detalle ||
        !pedido_consumidor
      ) {
        throw new ApiError(
          400,
          "Todos los campos obligatorios del reclamante deben ser completados.",
        );
      }

      // Generar código de seguimiento único: REC-YYYY-XXXX
      const anio = new Date().getFullYear();
      const countResult = await query(
        `SELECT COUNT(*) as total FROM libro_reclamaciones WHERE EXTRACT(YEAR FROM created_at) = $1`,
        [anio],
      );
      const correlativo = parseInt(countResult.rows[0].total, 10) + 1;
      const codigo_seguimiento = `REC-${anio}-${String(correlativo).padStart(4, "0")}`;

      const insertResult = await query(
        `INSERT INTO libro_reclamaciones (
          codigo_seguimiento, usuario_id, establecimiento_id,
          nombres_reclamante, apellidos_reclamante, tipo_documento, numero_documento,
          email, telefono, direccion, tipo_bien_contratado, tipo_registro,
          monto_reclamado, detalle, pedido_consumidor, estado
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'PENDIENTE'
        ) RETURNING *`,
        [
          codigo_seguimiento,
          usuario_id,
          establecimiento_id || null,
          nombres_reclamante,
          apellidos_reclamante,
          tipo_documento,
          numero_documento,
          email,
          telefono || null,
          direccion || null,
          tipo_bien_contratado,
          tipo_registro,
          monto_reclamado,
          detalle,
          pedido_consumidor,
        ],
      );

      return sendResponse(
        res,
        201,
        insertResult.rows[0],
        `Reclamo registrado exitosamente con código: ${codigo_seguimiento}`,
      );
    } catch (error) {
      next(error);
    }
  }

  // 2. Consultar reclamo por código de seguimiento (Público)
  static async consultarPorCodigo(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { codigo } = req.params;
      const result = await query(
        `SELECT lr.id, lr.codigo_seguimiento, lr.tipo_registro, lr.estado, lr.detalle, 
                lr.pedido_consumidor, lr.respuesta_admin, lr.fecha_respuesta, lr.created_at,
                e.nombre AS establecimiento_nombre
         FROM libro_reclamaciones lr
         LEFT JOIN establecimientos e ON e.id = lr.establecimiento_id
         WHERE lr.codigo_seguimiento = $1`,
        [codigo.toUpperCase()],
      );

      if (result.rows.length === 0) {
        throw new ApiError(
          404,
          `No se encontró ningún reclamo con el código ${codigo}`,
        );
      }

      return sendResponse(res, 200, result.rows[0], "Consulta exitosa");
    } catch (error) {
      next(error);
    }
  }

  // 3. Listar reclamos para el Administrador (Filtros por estado y local)
  static async listarAdmin(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { estado, establecimiento_id } = req.query;
      let queryStr = `
        SELECT lr.*, 
               e.nombre AS establecimiento_nombre,
               admin.nombres || ' ' || admin.apellidos AS admin_responsable_nombre
        FROM libro_reclamaciones lr
        LEFT JOIN establecimientos e ON e.id = lr.establecimiento_id
        LEFT JOIN usuarios admin ON admin.id = lr.admin_responsable_id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (estado) {
        params.push(estado);
        queryStr += ` AND lr.estado = $${params.length}`;
      }

      if (establecimiento_id) {
        params.push(establecimiento_id);
        queryStr += ` AND lr.establecimiento_id = $${params.length}`;
      }

      queryStr += ` ORDER BY lr.created_at DESC`;

      const result = await query(queryStr, params);
      return sendResponse(res, 200, result.rows, "Listado de reclamaciones");
    } catch (error) {
      next(error);
    }
  }

  // 4. Responder y resolver reclamo (Solo Admin)
  static async responderAdmin(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const { respuesta_admin, estado = "ATENDIDO" } = req.body;
      const admin_id = req.user!.id;

      if (!respuesta_admin || respuesta_admin.trim() === "") {
        throw new ApiError(400, "Debe ingresar una respuesta oficial para el reclamo.");
      }

      const result = await query(
        `UPDATE libro_reclamaciones
         SET respuesta_admin = $1,
             estado = $2,
             fecha_respuesta = CURRENT_TIMESTAMP,
             admin_responsable_id = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`,
        [respuesta_admin, estado, admin_id, id],
      );

      if (result.rows.length === 0) {
        throw new ApiError(404, "Reclamo no encontrado.");
      }

      return sendResponse(
        res,
        200,
        result.rows[0],
        "Reclamo atendido y actualizado correctamente.",
      );
    } catch (error) {
      next(error);
    }
  }
}
