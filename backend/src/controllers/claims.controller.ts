import { Request, Response, NextFunction } from "express";
import { query } from "../config/database";
import { ApiError, sendResponse } from "../utils";
import { AuthRequest } from "../types";

export class ClaimsController {
  // 1. Registrar nuevo reclamo o queja en Libro de Reclamaciones
  static async registrar(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const idUsuario = authReq.user?.id || null;

      const {
        id_establecimiento,
        id_sucursal,
        nombres_consumidor,
        apellidos_consumidor,
        tipo_documento = "DNI",
        numero_documento,
        es_menor_edad = false,
        nombre_apoderado,
        email,
        telefono,
        tipo = "RECLAMO",
        descripcion_bien_servicio,
        monto_reclamado = null,
        detalle,
        pedido_consumidor,
      } = req.body;

      if (
        !nombres_consumidor ||
        !apellidos_consumidor ||
        !numero_documento ||
        !email ||
        !detalle ||
        !pedido_consumidor
      ) {
        throw new ApiError(
          400,
          "Todos los campos obligatorios del consumidor deben ser completados.",
        );
      }

      // Código de reclamación: LR-YYYY-XXXXXX
      const anio = new Date().getFullYear();
      const correlativo = Date.now().toString().slice(-6);
      const codigoReclamacion = `LR-${anio}-${correlativo}`;

      // Fecha límite: +15 días hábiles (aprox 21 días calendario)
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + 21);

      const insertResult = await query(
        `INSERT INTO reclamaciones (
          codigo_reclamacion, id_usuario, id_establecimiento, id_sucursal,
          tipo, nombres_consumidor, apellidos_consumidor, tipo_documento,
          numero_documento, es_menor_edad, nombre_apoderado, telefono,
          email, descripcion_bien_servicio, monto_reclamado, detalle,
          pedido_consumidor, fecha_limite_respuesta, estado
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8,
          $9, $10, $11, $12,
          $13, $14, $15, $16,
          $17, $18, 'REGISTRADO'
        ) RETURNING id_reclamacion, codigo_reclamacion, fecha_registro, fecha_limite_respuesta`,
        [
          codigoReclamacion,
          idUsuario,
          id_establecimiento || null,
          id_sucursal || null,
          tipo,
          nombres_consumidor,
          apellidos_consumidor,
          tipo_documento,
          numero_documento,
          es_menor_edad ? 1 : 0,
          nombre_apoderado || null,
          telefono || null,
          email,
          descripcion_bien_servicio || "Servicio de Pasaporte Digital",
          monto_reclamado || null,
          detalle,
          pedido_consumidor,
          fechaLimite,
        ],
      );

      return sendResponse(
        res,
        201,
        insertResult.rows[0],
        `Reclamación registrada exitosamente con código: ${codigoReclamacion}`,
      );
    } catch (error) {
      next(error);
    }
  }

  // 2. Consultar reclamación por código
  static async consultarPorCodigo(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { codigo } = req.params;
      const result = await query(
        `SELECT r.id_reclamacion, r.codigo_reclamacion, r.tipo, r.estado, r.detalle,
                r.pedido_consumidor, r.respuesta_proveedor, r.fecha_respuesta, r.fecha_registro,
                r.fecha_limite_respuesta,
                e.nombre_comercial AS establecimiento_nombre,
                s.nombre AS sucursal_nombre
         FROM reclamaciones r
         LEFT JOIN establecimientos e ON e.id_establecimiento = r.id_establecimiento
         LEFT JOIN sucursales s ON s.id_sucursal = r.id_sucursal
         WHERE r.codigo_reclamacion = $1`,
        [codigo.toUpperCase()],
      );

      if (result.rows.length === 0) {
        throw new ApiError(
          404,
          `No se encontró ninguna reclamación con el código ${codigo}`,
        );
      }

      sendResponse(res, 200, result.rows[0]);
    } catch (error) {
      next(error);
    }
  }

  // 3. Listar reclamos para Administradores
  static async listarAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await query(
        `SELECT r.*, e.nombre_comercial AS establecimiento_nombre, s.nombre AS sucursal_nombre
         FROM reclamaciones r
         LEFT JOIN establecimientos e ON e.id_establecimiento = r.id_establecimiento
         LEFT JOIN sucursales s ON s.id_sucursal = r.id_sucursal
         ORDER BY r.fecha_registro DESC`,
      );
      sendResponse(res, 200, result.rows);
    } catch (error) {
      next(error);
    }
  }

  // 4. Responder reclamo (Admin)
  static async responderAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { respuesta_proveedor, estado = "RESPONDIDO" } = req.body;

      if (!respuesta_proveedor) {
        throw new ApiError(400, "La respuesta del proveedor es obligatoria");
      }

      const result = await query(
        `UPDATE reclamaciones
         SET respuesta_proveedor = $2,
             estado = $3,
             fecha_respuesta = CURRENT_TIMESTAMP
         WHERE id_reclamacion = $1
         RETURNING *`,
        [id, respuesta_proveedor, estado],
      );

      if (!result.rows[0]) {
        throw new ApiError(404, "Reclamación no encontrada");
      }

      sendResponse(res, 200, result.rows[0], "Respuesta registrada exitosamente");
    } catch (error) {
      next(error);
    }
  }
}
