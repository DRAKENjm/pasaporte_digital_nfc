import { Response, NextFunction } from "express";
import { query, pool } from "../config/database";
import { ApiError, sendResponse } from "../utils";
import { AuthenticatedRequest } from "../types";

export const RewardsController = {
  /** Listar recompensas disponibles con su establecimiento */
  async listar(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id_establecimiento } = req.query;

      let sql = `
        SELECT 
          r.id_recompensa,
          r.id_recompensa AS id,
          r.id_establecimiento,
          r.nombre,
          r.nombre AS nombre_recompensa,
          r.descripcion,
          r.imagen,
          r.imagen AS imagen_url,
          r.puntos_requeridos,
          r.puntos_requeridos AS costo_puntos_globales,
          r.stock,
          r.stock AS stock_disponible,
          r.stock_ilimitado,
          r.fecha_inicio,
          r.fecha_fin,
          r.estado,
          COALESCE(e.nombre_comercial, 'Pasaporte Digital Oficial') AS establecimiento_nombre,
          e.logo AS establecimiento_logo
        FROM recompensas r
        LEFT JOIN establecimientos e ON e.id_establecimiento = r.id_establecimiento
        WHERE r.estado = 'ACTIVA'
          AND (r.fecha_fin IS NULL OR r.fecha_fin > CURRENT_TIMESTAMP)
      `;

      const params: any[] = [];
      if (id_establecimiento) {
        params.push(id_establecimiento);
        sql += ` AND r.id_establecimiento = $${params.length}`;
      }

      sql += ` ORDER BY r.puntos_requeridos ASC`;

      const result = await query(sql, params);
      sendResponse(res, 200, result.rows, "Catálogo de recompensas");
    } catch (error) {
      next(error);
    }
  },

  /** 1. Solicitar Canje (Estado PENDIENTE y reserva de puntos) */
  async solicitarCanje(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const client = await pool.connect();
    try {
      const { id_recompensa, id_sucursal } = req.body;
      const idUsuario = req.user!.id;

      if (!id_recompensa) {
        throw new ApiError(400, "id_recompensa es obligatorio");
      }

      // Obtener cliente
      const clienteRes = await client.query(
        `SELECT id_cliente FROM clientes WHERE id_usuario = $1`,
        [idUsuario],
      );
      if (!clienteRes.rows[0]) {
        throw new ApiError(403, "No tienes perfil de cliente activo para canjear");
      }
      const idCliente = clienteRes.rows[0].id_cliente;

      await client.query("BEGIN");

      // Validar recompensa y stock (LEFT JOIN para permitir recompensas globales de plataforma)
      const recRes = await client.query(
        `SELECT r.*, COALESCE(e.nombre_comercial, 'Pasaporte Digital Oficial') AS nombre_comercial 
         FROM recompensas r
         LEFT JOIN establecimientos e ON e.id_establecimiento = r.id_establecimiento
         WHERE r.id_recompensa = $1 FOR UPDATE`,
        [id_recompensa],
      );

      const recompensa = recRes.rows[0];
      if (!recompensa || recompensa.estado !== "ACTIVA") {
        throw new ApiError(404, "Recompensa no disponible");
      }

      if (recompensa.stock_ilimitado === 0 && (recompensa.stock === null || recompensa.stock <= 0)) {
        throw new ApiError(400, "Recompensa agotada temporalmente");
      }

      // Validar saldo disponible (saldo total menos puntos en canjes PENDIENTES)
      const saldoTotalRes = await client.query(
        `SELECT COALESCE(SUM(cantidad), 0)::int AS saldo FROM movimientos_puntos WHERE id_cliente = $1`,
        [idCliente],
      );
      const saldoTotal = saldoTotalRes.rows[0].saldo;

      const reservadosRes = await client.query(
        `SELECT COALESCE(SUM(puntos_canje), 0)::int AS reservados 
         FROM canjes 
         WHERE id_cliente = $1 AND estado = 'PENDIENTE'`,
        [idCliente],
      );
      const puntosReservados = reservadosRes.rows[0].reservados;
      const saldoDisponible = saldoTotal - puntosReservados;

      if (saldoDisponible < recompensa.puntos_requeridos) {
        throw new ApiError(400, `Puntos insuficientes. Disponibles: ${saldoDisponible}, requeridos: ${recompensa.puntos_requeridos}`);
      }

      // Generar código de canje único
      const codigoCanje = `CNJ-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Insertar canje PENDIENTE
      const canjeRes = await client.query(
        `INSERT INTO canjes (
          id_cliente, id_recompensa, id_sucursal, codigo_canje,
          puntos_canje, estado, fecha_solicitud
        ) VALUES (
          $1, $2, $3, $4,
          $5, 'PENDIENTE', CURRENT_TIMESTAMP
        ) RETURNING id_canje, codigo_canje, fecha_solicitud`,
        [idCliente, id_recompensa, id_sucursal || null, codigoCanje, recompensa.puntos_requeridos],
      );

      // Si tiene stock finito, reservamos provisionalmente
      if (recompensa.stock_ilimitado === 0) {
        await client.query(
          `UPDATE recompensas SET stock = stock - 1 WHERE id_recompensa = $1`,
          [id_recompensa],
        );
      }

      await client.query("COMMIT");

      sendResponse(res, 201, {
        canje: canjeRes.rows[0],
        recompensa: {
          nombre: recompensa.nombre,
          establecimiento: recompensa.nombre_comercial,
          puntos_canjeados: recompensa.puntos_requeridos,
        },
        saldo_disponible_restante: saldoDisponible - recompensa.puntos_requeridos,
      }, "Solicitud de canje generada con éxito. Muestra el código en el local.");
    } catch (error) {
      await client.query("ROLLBACK");
      next(error);
    } finally {
      client.release();
    }
  },

  /** 2. Confirmar Entrega de Canje en Local (Trabajador valida código) */
  async confirmarEntrega(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const client = await pool.connect();
    try {
      const { codigo_canje, id_sucursal } = req.body;
      const idValidador = req.user!.id;

      if (!codigo_canje) {
        throw new ApiError(400, "codigo_canje es obligatorio");
      }

      await client.query("BEGIN");

      const canjeRes = await client.query(
        `SELECT c.*, r.nombre AS recompensa_nombre, r.id_establecimiento,
                cl.id_usuario AS cliente_usuario_id
         FROM canjes c
         JOIN recompensas r ON r.id_recompensa = c.id_recompensa
         JOIN clientes cl ON cl.id_cliente = c.id_cliente
         WHERE c.codigo_canje = $1 FOR UPDATE`,
        [codigo_canje.trim().toUpperCase()],
      );

      const canje = canjeRes.rows[0];
      if (!canje) throw new ApiError(404, "Código de canje no encontrado");

      if (canje.estado !== "PENDIENTE") {
        throw new ApiError(400, `El canje no se encuentra pendiente (estado actual: ${canje.estado})`);
      }

      // Marcar canje como CANJEADO
      await client.query(
        `UPDATE canjes
         SET estado = 'CANJEADO',
             id_sucursal = COALESCE($2, id_sucursal),
             id_usuario_validador = $3,
             fecha_validacion = CURRENT_TIMESTAMP
         WHERE id_canje = $1`,
        [canje.id_canje, id_sucursal || null, idValidador],
      );

      // Débito definitivo en el Libro Mayor (Ledger)
      const saldoRes = await client.query(
        `SELECT COALESCE(SUM(cantidad), 0)::int AS saldo FROM movimientos_puntos WHERE id_cliente = $1`,
        [canje.id_cliente],
      );
      const saldoAnterior = saldoRes.rows[0].saldo;
      const puntosDebito = -Math.abs(canje.puntos_canje);
      const saldoPosterior = saldoAnterior + puntosDebito;

      await client.query(
        `INSERT INTO movimientos_puntos (
          id_cliente, id_canje, tipo_movimiento, cantidad,
          saldo_anterior, saldo_posterior, descripcion, id_usuario_accion
        ) VALUES (
          $1, $2, 'CANJE', $3,
          $4, $5, $6, $7
        )`,
        [
          canje.id_cliente,
          canje.id_canje,
          puntosDebito,
          saldoAnterior,
          saldoPosterior,
          `Canje de recompensa: ${canje.recompensa_nombre}`,
          idValidador,
        ],
      );

      // Notificación al usuario
      await client.query(
        `INSERT INTO notificaciones (
          id_usuario, tipo_notificacion, titulo, mensaje, canal, estado_envio, referencia_tipo, referencia_id
        ) VALUES (
          $1, 'CANJE_UTILIZADO', '¡Recompensa entregada!',
          $2, 'APP', 'ENVIADA', 'CANJE', $3
        )`,
        [
          canje.cliente_usuario_id,
          `Tu canje de "${canje.recompensa_nombre}" ha sido entregado exitosamente.`,
          canje.id_canje,
        ],
      );

      await client.query("COMMIT");

      sendResponse(res, 200, {
        id_canje: canje.id_canje,
        codigo_canje: canje.codigo_canje,
        recompensa: canje.recompensa_nombre,
        puntos_descontados: canje.puntos_canje,
        saldo_restante: saldoPosterior,
      }, "Entrega de recompensa confirmada y puntos descontados definitivamente.");
    } catch (error) {
      await client.query("ROLLBACK");
      next(error);
    } finally {
      client.release();
    }
  },

  /** Consultar mis canjes (del cliente autenticado) */
  async misCanjes(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const idUsuario = req.user!.id;
      const result = await query(
        `SELECT 
          c.id_canje,
          c.codigo_canje,
          c.puntos_canje,
          c.estado,
          c.fecha_solicitud,
          c.fecha_validacion,
          r.nombre AS recompensa_nombre,
          r.imagen AS recompensa_imagen,
          COALESCE(e.nombre_comercial, 'Pasaporte Digital Oficial') AS establecimiento_nombre
         FROM canjes c
         JOIN clientes cl ON cl.id_cliente = c.id_cliente
         JOIN recompensas r ON r.id_recompensa = c.id_recompensa
         LEFT JOIN establecimientos e ON e.id_establecimiento = r.id_establecimiento
         WHERE cl.id_usuario = $1
         ORDER BY c.fecha_solicitud DESC`,
        [idUsuario],
      );
      sendResponse(res, 200, result.rows);
    } catch (error) {
      next(error);
    }
  },
};
