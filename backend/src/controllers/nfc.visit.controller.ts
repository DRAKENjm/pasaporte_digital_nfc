import { Response, NextFunction } from "express";
import { query, pool } from "../config/database";
import { ApiError, sendResponse } from "../utils";
import { AuthenticatedRequest } from "../types";

export const NfcVisitController = {
  /**
   * 1. LECTURA PREVIA NFC
   * Identifica la tarjeta y al cliente, pero NO crea la visita todavía.
   */
  async identificarTarjeta(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { uid_nfc } = req.body;
      if (!uid_nfc) {
        throw new ApiError(400, "uid_nfc es obligatorio");
      }

      const tarjetaRes = await query(
        `SELECT t.id_tarjeta, t.uid_nfc, t.codigo_interno, t.estado AS tarjeta_estado,
                c.id_cliente, c.codigo_cliente,
                u.id_usuario, u.nombres, u.apellidos, u.foto_perfil, u.estado AS usuario_estado,
                (
                  SELECT COALESCE(SUM(cantidad), 0)::int
                  FROM movimientos_puntos
                  WHERE id_cliente = c.id_cliente
                ) AS puntos_actuales
         FROM tarjetas_nfc t
         LEFT JOIN clientes c ON c.id_cliente = t.id_cliente
         LEFT JOIN usuarios u ON u.id_usuario = c.id_usuario
         WHERE t.uid_nfc = $1`,
        [uid_nfc.trim()],
      );

      const data = tarjetaRes.rows[0];
      if (!data) {
        throw new ApiError(404, "Tarjeta NFC no registrada en el sistema");
      }

      if (data.tarjeta_estado !== "ACTIVA") {
        throw new ApiError(400, `La tarjeta se encuentra en estado: ${data.tarjeta_estado}`);
      }

      if (!data.id_cliente || data.usuario_estado !== 1) {
        throw new ApiError(400, "El cliente asociado a esta tarjeta no está activo");
      }

      sendResponse(res, 200, {
        id_tarjeta: data.id_tarjeta,
        uid_nfc: data.uid_nfc,
        codigo_interno: data.codigo_interno,
        cliente: {
          id_cliente: data.id_cliente,
          codigo_cliente: data.codigo_cliente,
          nombres: data.nombres,
          apellidos: data.apellidos,
          foto_perfil: data.foto_perfil,
          puntos_actuales: data.puntos_actuales,
        },
      }, "Tarjeta identificada. Requiere confirmación del trabajador.");
    } catch (error) {
      next(error);
    }
  },

  /**
   * 2. CONFIRMAR VISITA (Transacción atómica: Visita + Sello + Movimiento Ledger)
   */
  async confirmarVisita(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    const client = await pool.connect();
    try {
      const { id_tarjeta, id_sucursal, observacion } = req.body;
      const validadorId = req.user!.id;

      if (!id_tarjeta || !id_sucursal) {
        throw new ApiError(400, "id_tarjeta e id_sucursal son obligatorios");
      }

      await client.query("BEGIN");

      // Validar tarjeta y cliente activo
      const tarjetaRes = await client.query(
        `SELECT t.id_tarjeta, t.id_cliente, t.estado, c.id_usuario
         FROM tarjetas_nfc t
         JOIN clientes c ON c.id_cliente = t.id_cliente
         WHERE t.id_tarjeta = $1 AND t.estado = 'ACTIVA'`,
        [id_tarjeta],
      );

      if (!tarjetaRes.rows[0]) {
        throw new ApiError(400, "Tarjeta NFC no válida o inactiva");
      }
      const clienteId = tarjetaRes.rows[0].id_cliente;

      // Validar sucursal y establecimiento
      const sucursalRes = await client.query(
        `SELECT s.id_sucursal, s.id_establecimiento, s.nombre AS sucursal_nombre,
                e.nombre_comercial, e.estado AS est_estado
         FROM sucursales s
         JOIN establecimientos e ON e.id_establecimiento = s.id_establecimiento
         WHERE s.id_sucursal = $1 AND s.estado = 1 AND e.estado = 'ACTIVO'`,
        [id_sucursal],
      );

      if (!sucursalRes.rows[0]) {
        throw new ApiError(400, "La sucursal o el establecimiento no se encuentran activos");
      }
      const establecimientoId = sucursalRes.rows[0].id_establecimiento;

      // Obtener programa de sellos activo del establecimiento
      const progRes = await client.query(
        `SELECT ps.id_programa, ps.meta_sellos, ps.max_sellos_dia, ps.nombre_sello, ps.imagen_sello,
                COALESCE(ps.puntos_por_visita, rp.valor, 20) AS puntos_por_sello
         FROM programas_sellos ps
         LEFT JOIN reglas_puntos rp ON rp.id_programa = ps.id_programa AND rp.tipo_regla = 'POR_SELLO' AND rp.estado = 1
         WHERE ps.id_establecimiento = $1 AND ps.estado = 'ACTIVO'
         LIMIT 1`,
        [establecimientoId],
      );

      const programa = progRes.rows[0];
      if (!programa) {
        throw new ApiError(400, "El establecimiento no cuenta con un programa de sellos activo");
      }

      // Validar límite diario de sellos para el cliente en este programa
      if (programa.max_sellos_dia) {
        const sellosHoyRes = await client.query(
          `SELECT COUNT(*)::int AS total_hoy
           FROM sellos_digitales s
           JOIN visitas v ON v.id_visita = s.id_visita
           WHERE v.id_cliente = $1 AND s.id_programa = $2 
             AND s.estado = 'OTORGADO'
             AND s.fecha_otorgamiento >= CURRENT_DATE`,
          [clienteId, programa.id_programa],
        );
        if (sellosHoyRes.rows[0].total_hoy >= programa.max_sellos_dia) {
          throw new ApiError(400, `Ya alcanzaste el límite máximo de ${programa.max_sellos_dia} sellos por día en este local`);
        }
      }

      // 1. Crear Visita Confirmada
      const visitaRes = await client.query(
        `INSERT INTO visitas (id_cliente, id_tarjeta, id_sucursal, id_usuario_validador, estado, observacion)
         VALUES ($1, $2, $3, $4, 'CONFIRMADA', $5)
         RETURNING id_visita, fecha_hora`,
        [clienteId, id_tarjeta, id_sucursal, validadorId, observacion || null],
      );
      const visitaId = visitaRes.rows[0].id_visita;

      // Calcular número de orden del sello en el ciclo de la meta
      const totalSellosClienteRes = await client.query(
        `SELECT COUNT(*)::int AS total
         FROM sellos_digitales
         WHERE id_programa = $1 AND estado = 'OTORGADO'
           AND id_visita IN (SELECT id_visita FROM visitas WHERE id_cliente = $2)`,
        [programa.id_programa, clienteId],
      );
      const ordenSello = (totalSellosClienteRes.rows[0].total % programa.meta_sellos) + 1;

      // 2. Crear Sello Digital
      const selloRes = await client.query(
        `INSERT INTO sellos_digitales (id_visita, id_programa, numero_sello, cantidad, estado)
         VALUES ($1, $2, $3, 1, 'OTORGADO')
         RETURNING id_sello, numero_sello`,
        [visitaId, programa.id_programa, ordenSello],
      );
      const selloId = selloRes.rows[0].id_sello;

      // 3. Obtener saldo anterior del ledger
      const saldoRes = await client.query(
        `SELECT COALESCE(SUM(cantidad), 0)::int AS saldo
         FROM movimientos_puntos
         WHERE id_cliente = $1`,
        [clienteId],
      );
      const saldoAnterior = saldoRes.rows[0].saldo;
      const puntosOtorgados = Number(programa.puntos_por_sello);
      const saldoPosterior = saldoAnterior + puntosOtorgados;

      // 4. Crear Movimiento Contable de Puntos (Ledger)
      await client.query(
        `INSERT INTO movimientos_puntos (
          id_cliente, id_programa, id_visita, id_sello,
          tipo_movimiento, cantidad, saldo_anterior, saldo_posterior,
          descripcion, id_usuario_accion
        ) VALUES (
          $1, $2, $3, $4,
          'GANANCIA_SELLO', $5, $6, $7,
          $8, $9
        )`,
        [
          clienteId,
          programa.id_programa,
          visitaId,
          selloId,
          puntosOtorgados,
          saldoAnterior,
          saldoPosterior,
          `Visita a ${sucursalRes.rows[0].nombre_comercial} (${sucursalRes.rows[0].sucursal_nombre})`,
          validadorId,
        ],
      );

      // 5. Crear Notificación para el cliente
      await client.query(
        `INSERT INTO notificaciones (
          id_usuario, tipo_notificacion, titulo, mensaje, canal, estado_envio, referencia_tipo, referencia_id
        ) VALUES (
          $1, 'SELLO_OBTENIDO', '¡Nuevo sello obtenido!',
          $2, 'APP', 'ENVIADA', 'VISITA', $3
        )`,
        [
          tarjetaRes.rows[0].id_usuario,
          `Has obtenido el sello #${ordenSello} y ganado +${puntosOtorgados} puntos en ${sucursalRes.rows[0].nombre_comercial}.`,
          visitaId,
        ],
      );

      // 6. Auditoría
      await client.query(
        `INSERT INTO auditoria (id_usuario, modulo, accion, entidad, id_entidad, descripcion)
         VALUES ($1, 'VISITAS', 'CONFIRMAR', 'visitas', $2, $3)`,
        [
          validadorId,
          visitaId,
          `Confirmación de visita para cliente ${clienteId} en sucursal ${id_sucursal}`,
        ],
      );

      await client.query("COMMIT");

      sendResponse(res, 201, {
        visita: {
          id_visita: visitaId,
          fecha_hora: visitaRes.rows[0].fecha_hora,
          sucursal: sucursalRes.rows[0].sucursal_nombre,
          establecimiento: sucursalRes.rows[0].nombre_comercial,
        },
        sello: {
          id_sello: selloId,
          numero_sello: ordenSello,
          meta_sellos: programa.meta_sellos,
          nombre_sello: programa.nombre_sello,
        },
        puntos: {
          puntos_ganados: puntosOtorgados,
          saldo_actual: saldoPosterior,
        },
      }, "Visita confirmada y puntos acreditados con éxito.");
    } catch (error) {
      await client.query("ROLLBACK");
      next(error);
    } finally {
      client.release();
    }
  },

  /** Asignar / Activar Tarjeta NFC a un Cliente */
  async asignarTarjeta(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { uid_nfc, id_cliente } = req.body;
      const operadorId = req.user!.id;

      if (!uid_nfc || !id_cliente) {
        throw new ApiError(400, "uid_nfc e id_cliente son obligatorios");
      }

      // Validar cliente
      const clienteRes = await query(`SELECT * FROM clientes WHERE id_cliente = $1`, [id_cliente]);
      if (!clienteRes.rows[0]) throw new ApiError(404, "Cliente no encontrado");

      // Buscar si la tarjeta ya existe en stock
      const tarjetaExistente = await query(`SELECT * FROM tarjetas_nfc WHERE uid_nfc = $1`, [uid_nfc]);

      if (tarjetaExistente.rows[0] && tarjetaExistente.rows[0].estado !== "DISPONIBLE") {
        throw new ApiError(400, `La tarjeta se encuentra en estado ${tarjetaExistente.rows[0].estado}`);
      }

      // Si el cliente ya tenía una tarjeta activa, reemplazarla
      await query(
        `UPDATE tarjetas_nfc
         SET estado = 'REEMPLAZADA', fecha_actualizacion = CURRENT_TIMESTAMP
         WHERE id_cliente = $1 AND estado = 'ACTIVA'`,
        [id_cliente],
      );

      let idTarjeta;
      if (tarjetaExistente.rows[0]) {
        idTarjeta = tarjetaExistente.rows[0].id_tarjeta;
        await query(
          `UPDATE tarjetas_nfc
           SET id_cliente = $1, estado = 'ACTIVA', es_principal = 1, fecha_activacion = CURRENT_TIMESTAMP
           WHERE id_tarjeta = $2`,
          [id_cliente, idTarjeta],
        );
      } else {
        const codigoInterno = `NFC-${Date.now().toString().slice(-6)}`;
        const insRes = await query(
          `INSERT INTO tarjetas_nfc (id_cliente, uid_nfc, codigo_interno, es_principal, estado, fecha_activacion)
           VALUES ($1, $2, $3, 1, 'ACTIVA', CURRENT_TIMESTAMP)
           RETURNING id_tarjeta`,
          [id_cliente, uid_nfc, codigoInterno],
        );
        idTarjeta = insRes.rows[0].id_tarjeta;
      }

      // Historial de tarjeta
      await query(
        `INSERT INTO historial_tarjeta_nfc (id_tarjeta, id_usuario_accion, accion, estado_anterior, estado_nuevo, motivo)
         VALUES ($1, $2, 'ACTIVACION', 'DISPONIBLE', 'ACTIVA', 'Asignación de tarjeta a cliente')`,
        [idTarjeta, operadorId],
      );

      sendResponse(res, 200, { id_tarjeta: idTarjeta, estado: "ACTIVA" }, "Tarjeta NFC activada correctamente");
    } catch (error) {
      next(error);
    }
  },
};
