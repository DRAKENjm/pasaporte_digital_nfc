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
        establecimiento_id,
        id_sucursal,
        nombres_consumidor,
        nombres_reclamante,
        apellidos_consumidor,
        apellidos_reclamante,
        tipo_documento = "DNI",
        numero_documento,
        email,
        telefono,
        tipo = "RECLAMO",
        tipo_registro,
        descripcion_bien_servicio,
        tipo_bien_contratado,
        monto_reclamado = null,
        detalle,
        pedido_consumidor,
      } = req.body;

      const nombres = (nombres_consumidor || nombres_reclamante || "").trim();
      const apellidos = (apellidos_consumidor || apellidos_reclamante || "").trim();
      const numDoc = (numero_documento || "").trim();
      const correo = (email || "").trim();
      const det = (detalle || "").trim();
      const ped = (pedido_consumidor || "").trim();
      const tipoFinal = (tipo || tipo_registro || "RECLAMO").toUpperCase();
      const estId = id_establecimiento || establecimiento_id || null;
      const descBien =
        descripcion_bien_servicio?.trim() ||
        (tipo_bien_contratado ? `Bien contratado: ${tipo_bien_contratado}` : "Servicio de Pasaporte Digital");

      if (!nombres || !apellidos || !numDoc || !correo || !det || !ped) {
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
          numero_documento, telefono, email, descripcion_bien_servicio,
          monto_reclamado, detalle, pedido_consumidor, fecha_limite_respuesta, estado
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8,
          $9, $10, $11, $12,
          $13, $14, $15, $16, 'REGISTRADO'
        ) RETURNING 
          id_reclamacion, codigo_reclamacion,
          id_reclamacion AS id, codigo_reclamacion AS codigo_seguimiento,
          fecha_registro, fecha_limite_respuesta, estado`,
        [
          codigoReclamacion,
          idUsuario,
          estId,
          id_sucursal || null,
          tipoFinal,
          nombres,
          apellidos,
          tipo_documento,
          numDoc,
          telefono?.trim() || null,
          correo,
          descBien,
          monto_reclamado ? parseFloat(monto_reclamado) : null,
          det,
          ped,
          fechaLimite,
        ],
      );

      // Notificar a los administradores en el sistema
      try {
        const admins = await query(
          `SELECT u.id_usuario 
           FROM usuarios u 
           JOIN roles r ON r.id_rol = u.id_rol 
           WHERE r.nombre IN ('ADMIN', 'ADMIN_GENERAL')`,
        );
        for (const admin of admins.rows) {
          await query(
            `INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo, leida)
             VALUES ($1, $2, $3, $4, FALSE)`,
            [
              admin.id_usuario,
              `Nueva ${tipoFinal === "QUEJA" ? "Queja" : "Reclamación"} Registrada`,
              `${nombres} ${apellidos} ha registrado la reclamación ${codigoReclamacion}.`,
              "RECLAMO",
            ],
          );
        }
      } catch (notifErr) {
        console.error("Error al generar notificación de reclamo para administradores:", notifErr);
      }

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

  // 2. Consultar reclamación por código de seguimiento
  static async consultarPorCodigo(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { codigo } = req.params;
      const result = await query(
        `SELECT r.id_reclamacion, r.codigo_reclamacion,
                r.id_reclamacion AS id, r.codigo_reclamacion AS codigo_seguimiento,
                r.tipo, r.tipo AS tipo_registro,
                r.nombres_consumidor, r.apellidos_consumidor,
                r.nombres_consumidor AS nombres_reclamante, r.apellidos_consumidor AS apellidos_reclamante,
                r.tipo_documento, r.numero_documento, r.email, r.telefono,
                r.estado, r.detalle, r.pedido_consumidor,
                r.respuesta_proveedor, r.respuesta_proveedor AS respuesta_admin,
                r.fecha_respuesta, r.fecha_registro, r.fecha_registro AS created_at,
                r.fecha_limite_respuesta,
                e.nombre_comercial AS establecimiento_nombre,
                s.nombre AS sucursal_nombre
         FROM reclamaciones r
         LEFT JOIN establecimientos e ON e.id_establecimiento = r.id_establecimiento
         LEFT JOIN sucursales s ON s.id_sucursal = r.id_sucursal
         WHERE UPPER(r.codigo_reclamacion) = $1`,
        [codigo.toUpperCase().trim()],
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

  // 3. Mis reclamaciones (usuario autenticado)
  static async misReclamaciones(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const authReq = req as AuthRequest;
      const idUsuario = authReq.user?.id;
      const userEmail = authReq.user?.email;

      if (!idUsuario) {
        throw new ApiError(401, "No autenticado");
      }

      const result = await query(
        `SELECT r.*,
                r.id_reclamacion AS id,
                r.codigo_reclamacion AS codigo_seguimiento,
                r.nombres_consumidor AS nombres_reclamante,
                r.apellidos_consumidor AS apellidos_reclamante,
                r.tipo AS tipo_registro,
                r.respuesta_proveedor AS respuesta_admin,
                r.fecha_registro AS created_at,
                e.nombre_comercial AS establecimiento_nombre,
                s.nombre AS sucursal_nombre
         FROM reclamaciones r
         LEFT JOIN establecimientos e ON e.id_establecimiento = r.id_establecimiento
         LEFT JOIN sucursales s ON s.id_sucursal = r.id_sucursal
         WHERE r.id_usuario = $1 OR LOWER(r.email) = LOWER($2)
         ORDER BY r.fecha_registro DESC`,
        [idUsuario, userEmail || ""],
      );

      sendResponse(res, 200, result.rows);
    } catch (error) {
      next(error);
    }
  }

  // 4. Listar reclamos para Administradores
  static async listarAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await query(
        `SELECT r.*,
                r.id_reclamacion AS id,
                r.codigo_reclamacion AS codigo_seguimiento,
                r.nombres_consumidor AS nombres_reclamante,
                r.apellidos_consumidor AS apellidos_reclamante,
                r.tipo AS tipo_registro,
                r.respuesta_proveedor AS respuesta_admin,
                r.fecha_registro AS created_at,
                e.nombre_comercial AS establecimiento_nombre,
                s.nombre AS sucursal_nombre
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

  // 5. Responder reclamo (Admin)
  static async responderAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { respuesta_proveedor, respuesta_admin, estado = "ATENDIDO" } = req.body;
      const respuesta = (respuesta_proveedor || respuesta_admin || "").trim();

      if (!respuesta) {
        throw new ApiError(400, "La respuesta del proveedor o motivo es obligatorio.");
      }

      const result = await query(
        `UPDATE reclamaciones
         SET respuesta_proveedor = $2,
             estado = $3,
             fecha_respuesta = CURRENT_TIMESTAMP
         WHERE id_reclamacion = $1
         RETURNING *, id_reclamacion AS id, codigo_reclamacion AS codigo_seguimiento`,
        [id, respuesta, estado],
      );

      const updated = result.rows[0];
      if (!updated) {
        throw new ApiError(404, "Reclamación no encontrada");
      }

      // Notificar al usuario consumidor si está registrado
      if (updated.id_usuario) {
        try {
          const estadoEtiqueta = estado === "RECHAZADO" ? "ha sido Rechazada" : "ha sido Atendida";
          await query(
            `INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo, leida)
             VALUES ($1, $2, $3, $4, FALSE)`,
            [
              updated.id_usuario,
              `Reclamación ${updated.codigo_reclamacion} ${estado === "RECHAZADO" ? "Rechazada" : "Resuelta"}`,
              `Tu reclamación ${updated.codigo_reclamacion} ${estadoEtiqueta}. Respuesta de la administración: "${respuesta.slice(0, 120)}${respuesta.length > 120 ? "..." : ""}"`,
              "RECLAMO",
            ],
          );
        } catch (notifErr) {
          console.error("Error al notificar al consumidor del reclamo:", notifErr);
        }
      }

      sendResponse(res, 200, updated, "Respuesta y estado registrados exitosamente");
    } catch (error) {
      next(error);
    }
  }
}
