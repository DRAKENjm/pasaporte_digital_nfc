import { Response, NextFunction } from "express";
import { query } from "../config/database";
import { sendResponse, ApiError } from "../utils";
import { AuthenticatedRequest } from "../types";

export const ActivityController = {
  /** Feed cronológico de actividad (visitas, sellos y movimientos de puntos del cliente) */
  async feed(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const idUsuario = req.user!.id;

      // Obtener cliente
      const clienteRes = await query(
        `SELECT id_cliente FROM clientes WHERE id_usuario = $1`,
        [idUsuario],
      );

      if (!clienteRes.rows[0]) {
        sendResponse(res, 200, {
          resumen: { puntos_actuales: 0, total_visitas: 0, total_sellos: 0 },
          movimientos: [],
          visitas_recientes: [],
        });
        return;
      }

      const idCliente = clienteRes.rows[0].id_cliente;

      // 1. Resumen de saldos y contadores
      const resumenRes = await query(
        `SELECT 
          (SELECT COALESCE(SUM(cantidad), 0)::int FROM movimientos_puntos WHERE id_cliente = $1) AS puntos_actuales,
          (SELECT COUNT(*)::int FROM visitas WHERE id_cliente = $1 AND estado = 'CONFIRMADA') AS total_visitas,
          (SELECT COUNT(*)::int FROM sellos_digitales s JOIN visitas v ON v.id_visita = s.id_visita WHERE v.id_cliente = $1 AND s.estado = 'OTORGADO') AS total_sellos
        `,
        [idCliente],
      );

      // 2. Historial de movimientos de puntos (Ledger)
      const movimientosRes = await query(
        `SELECT 
          m.id_movimiento,
          m.tipo_movimiento,
          m.cantidad,
          m.saldo_anterior,
          m.saldo_posterior,
          m.descripcion,
          m.fecha_movimiento,
          e.nombre_comercial AS establecimiento_nombre,
          ps.nombre_sello,
          ps.color_sello
         FROM movimientos_puntos m
         LEFT JOIN programas_sellos ps ON ps.id_programa = m.id_programa
         LEFT JOIN establecimientos e ON e.id_establecimiento = ps.id_establecimiento
         WHERE m.id_cliente = $1
         ORDER BY m.fecha_movimiento DESC
         LIMIT 30`,
        [idCliente],
      );

      // 3. Historial de visitas con detalles del local y sellos obtenidos
      const visitasRes = await query(
        `SELECT 
          v.id_visita,
          v.fecha_hora,
          v.estado,
          s.nombre AS sucursal_nombre,
          s.direccion AS sucursal_direccion,
          e.nombre_comercial AS establecimiento_nombre,
          e.logo AS establecimiento_logo,
          sd.numero_sello,
          sd.estado AS sello_estado,
          ps.meta_sellos,
          ps.nombre_sello,
          ps.imagen_sello,
          COALESCE(ps.color_sello, '#7C0A1E') AS color_sello
         FROM visitas v
         JOIN sucursales s ON s.id_sucursal = v.id_sucursal
         JOIN establecimientos e ON e.id_establecimiento = s.id_establecimiento
         LEFT JOIN sellos_digitales sd ON sd.id_visita = v.id_visita
         LEFT JOIN programas_sellos ps ON ps.id_programa = sd.id_programa
         WHERE v.id_cliente = $1
         ORDER BY v.fecha_hora DESC
         LIMIT 20`,
        [idCliente],
      );

      sendResponse(res, 200, {
        resumen: resumenRes.rows[0] || { puntos_actuales: 0, total_visitas: 0, total_sellos: 0 },
        movimientos: movimientosRes.rows,
        visitas_recientes: visitasRes.rows,
      });
    } catch (error) {
      next(error);
    }
  },

  /** Consultar notificaciones del usuario */
  async notificaciones(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const idUsuario = req.user!.id;
      const result = await query(
        `SELECT * FROM notificaciones 
         WHERE id_usuario = $1 
         ORDER BY fecha_creacion DESC 
         LIMIT 50`,
        [idUsuario],
      );
      sendResponse(res, 200, result.rows);
    } catch (error) {
      next(error);
    }
  },

  /** Marcar notificación como leída */
  async marcarNotificacionLeida(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const idUsuario = req.user!.id;
      await query(
        `UPDATE notificaciones 
         SET leida = 1, fecha_lectura = CURRENT_TIMESTAMP 
         WHERE id_notificacion = $1 AND id_usuario = $2`,
        [id, idUsuario],
      );
      sendResponse(res, 200, { success: true });
    } catch (error) {
      next(error);
    }
  },
};
