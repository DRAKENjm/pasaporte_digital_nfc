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
<<<<<<< HEAD
=======

  /** Sellos del usuario agrupados por establecimiento y categoría */
  async misSellos(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const idUsuario = req.user!.id;

      // Obtener cliente
      const clienteRes = await query(
        `SELECT id_cliente FROM clientes WHERE id_usuario = $1`,
        [idUsuario],
      );

      const idCliente = clienteRes.rows[0]?.id_cliente || null;

      // visitas NO tiene id_establecimiento: se llega por sucursales
      // categorias usa icono_url (no icono)
      const sql = `
        SELECT 
          e.id_establecimiento,
          e.nombre_comercial,
          e.razon_social,
          e.descripcion,
          e.logo,
          e.imagen_portada,
          e.telefono,
          e.email,
          s.direccion,
          c.id AS categoria_id,
          COALESCE(c.nombre, 'General') AS categoria_nombre,
          COALESCE(c.icono_url, 'coffee') AS categoria_icono,
          ps.id_programa,
          COALESCE(ps.nombre, 'Pasaporte de Sellos') AS programa_nombre,
          ps.descripcion AS programa_descripcion,
          COALESCE(ps.meta_sellos, 6) AS meta_sellos,
          COALESCE(ps.nombre_sello, 'Sello Oficial') AS nombre_sello,
          ps.imagen_sello,
          COALESCE(ps.color_sello, '#7C0A1E') AS color_sello,
          COALESCE(
            (
              SELECT COUNT(*)::int
              FROM sellos_digitales sd
              JOIN visitas vi ON vi.id_visita = sd.id_visita
              JOIN sucursales su ON su.id_sucursal = vi.id_sucursal
              WHERE vi.id_cliente = $1
                AND su.id_establecimiento = e.id_establecimiento
                AND sd.estado = 'OTORGADO'
                AND vi.estado = 'CONFIRMADA'
            ), 0
          ) AS sellos_obtenidos,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id_sello', sd.id_sello,
                  'numero_sello', sd.numero_sello,
                  'fecha_otorgamiento', sd.fecha_otorgamiento,
                  'es_festivo', 0
                ) ORDER BY sd.fecha_otorgamiento ASC
              )
              FROM sellos_digitales sd
              JOIN visitas vi ON vi.id_visita = sd.id_visita
              JOIN sucursales su ON su.id_sucursal = vi.id_sucursal
              WHERE vi.id_cliente = $1
                AND su.id_establecimiento = e.id_establecimiento
                AND sd.estado = 'OTORGADO'
                AND vi.estado = 'CONFIRMADA'
            ), '[]'::json
          ) AS sellos_detalle,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id_recompensa', r.id_recompensa,
                  'nombre', r.nombre,
                  'descripcion', r.descripcion,
                  'puntos_requeridos', r.puntos_requeridos
                ) ORDER BY r.puntos_requeridos ASC
              )
              FROM recompensas r
              WHERE r.id_establecimiento = e.id_establecimiento
                AND r.estado = 'ACTIVA'
            ), '[]'::json
          ) AS recompensas
        FROM establecimientos e
        LEFT JOIN categorias_establecimiento c ON c.id = e.categoria_id
        LEFT JOIN LATERAL (
          SELECT id_programa, nombre, descripcion, meta_sellos, nombre_sello, imagen_sello, color_sello
          FROM programas_sellos
          WHERE id_establecimiento = e.id_establecimiento AND estado = 'ACTIVO'
          ORDER BY id_programa DESC
          LIMIT 1
        ) ps ON true
        LEFT JOIN LATERAL (
          SELECT direccion
          FROM sucursales
          WHERE id_establecimiento = e.id_establecimiento AND estado = 1
          ORDER BY es_principal DESC
          LIMIT 1
        ) s ON true
        WHERE e.estado = 'ACTIVO'
        ORDER BY c.nombre ASC NULLS LAST, e.nombre_comercial ASC
      `;

      const result = await query(sql, [idCliente]);
      sendResponse(res, 200, result.rows, "Sellos por establecimiento");
    } catch (error) {
      next(error);
    }
  },
>>>>>>> 250e65a (beta de cliente, de alfa a beta)
};
