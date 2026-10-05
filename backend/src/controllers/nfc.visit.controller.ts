import { Response, NextFunction } from "express";
import { query, pool } from "../config/database";
import { ApiError, sendResponse } from "../utils";
import { AuthenticatedRequest } from "../types";

// PostgreSQL devuelve BIGINT como texto; conservarlo evita pérdida de precisión.
const isValidId = (value: unknown): boolean => {
  if (typeof value === "number") return Number.isSafeInteger(value) && value > 0;
  return typeof value === "string" && /^[1-9]\d{0,18}$/.test(value) &&
    BigInt(value) <= 9223372036854775807n;
};

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
      const { uid_nfc, qr_code } = req.body;
      const valorBusqueda = (uid_nfc || qr_code || "").toString().trim();
      if (!valorBusqueda || valorBusqueda.length > 255) {
        throw new ApiError(400, "Debes proporcionar el UID NFC o el Código QR de respaldo");
      }

      // Buscar por uid_nfc exacto, qr_respaldo, codigo_interno o codigo_cliente
      const tarjetaRes = await query(
        `SELECT t.id_tarjeta, t.uid_nfc, t.codigo_interno, t.qr_respaldo, t.estado AS tarjeta_estado,
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
         WHERE UPPER(t.uid_nfc) = UPPER($1) 
            OR UPPER(t.codigo_interno) = UPPER($1)
            OR UPPER(COALESCE(t.qr_respaldo, '')) = UPPER($1)
            OR UPPER(COALESCE(c.codigo_cliente, '')) = UPPER($1)
         ORDER BY (CASE WHEN UPPER(t.uid_nfc) = UPPER($1) THEN 1 ELSE 2 END), t.es_principal DESC
         LIMIT 1`,
        [valorBusqueda],
      );

      let data = tarjetaRes.rows[0];

      // Si no encontró tarjeta activa pero el código pertenece a un cliente, buscar la tarjeta activa de ese cliente
      if (!data) {
        const clienteCheck = await query(
          `SELECT c.id_cliente, c.codigo_cliente, u.id_usuario, u.nombres, u.apellidos, u.foto_perfil, u.estado AS usuario_estado,
                  (SELECT COALESCE(SUM(cantidad), 0)::int FROM movimientos_puntos WHERE id_cliente = c.id_cliente) AS puntos_actuales
           FROM clientes c
           JOIN usuarios u ON u.id_usuario = c.id_usuario
           WHERE UPPER(c.codigo_cliente) = UPPER($1) OR u.id_usuario::text = $1`,
          [valorBusqueda]
        );
        if (clienteCheck.rows[0]) {
          const cli = clienteCheck.rows[0];
          const tRes = await query(
            `SELECT id_tarjeta, uid_nfc, codigo_interno, qr_respaldo, estado AS tarjeta_estado
             FROM tarjetas_nfc WHERE id_cliente = $1 AND estado = 'ACTIVA' LIMIT 1`,
            [cli.id_cliente]
          );
          if (tRes.rows[0]) {
            data = { ...tRes.rows[0], ...cli };
          }
        }
      }

      if (!data) {
        throw new ApiError(404, "Tarjeta sin información o no registrada");
      }

      if (data.tarjeta_estado !== "ACTIVA") {
        if (data.tarjeta_estado === "DISPONIBLE" || data.tarjeta_estado === "EN_STOCK") {
          throw new ApiError(
            400,
            "Tarjeta física sin vincular. El cliente debe registrarse primero para activar su pasaporte.",
          );
        }
        throw new ApiError(400, `La tarjeta no es válida (Estado: ${data.tarjeta_estado})`);
      }

      if (!data.id_cliente || data.usuario_estado !== 1) {
        throw new ApiError(400, "El cliente asociado a esta tarjeta no se encuentra activo");
      }

      // Validar si el cliente ya recibió un sello hoy en este establecimiento si se proveyó la sucursal
      let yaTieneSelloHoy = false;
      let montoPorPunto = 10;
      let puntosPorVisitaLocal = 20;
      const { id_sucursal } = req.body;
      if (id_sucursal) {
        const sucEstRes = await query(
          `SELECT s.id_establecimiento, e.monto_por_punto,
                  COALESCE(ps.puntos_por_visita, 20) AS puntos_por_visita
           FROM sucursales s
           JOIN establecimientos e ON e.id_establecimiento = s.id_establecimiento
           LEFT JOIN LATERAL (
             SELECT puntos_por_visita FROM programas_sellos
             WHERE id_establecimiento = e.id_establecimiento AND estado = 'ACTIVO'
             ORDER BY id_programa DESC LIMIT 1
           ) ps ON true
           WHERE s.id_sucursal = $1`,
          [id_sucursal]
        );
        if (sucEstRes.rows[0]) {
          const estId = sucEstRes.rows[0].id_establecimiento;
          if (sucEstRes.rows[0].monto_por_punto != null) {
            montoPorPunto = Number(sucEstRes.rows[0].monto_por_punto);
          }
          if (sucEstRes.rows[0].puntos_por_visita != null) {
            puntosPorVisitaLocal = Number(sucEstRes.rows[0].puntos_por_visita);
          }
          const sellosHoyRes = await query(
            `SELECT COUNT(*)::int AS total_hoy
             FROM sellos_digitales s
             JOIN visitas v ON v.id_visita = s.id_visita
             JOIN sucursales suc ON suc.id_sucursal = v.id_sucursal
             WHERE v.id_cliente = $1 AND suc.id_establecimiento = $2 
               AND s.estado = 'OTORGADO'
               AND s.fecha_otorgamiento >= (date_trunc('day', now() AT TIME ZONE 'America/Lima') AT TIME ZONE 'America/Lima')`,
            [data.id_cliente, estId],
          );
          yaTieneSelloHoy = (sellosHoyRes.rows[0]?.total_hoy || 0) >= 1;
        }
      }

      sendResponse(res, 200, {
        id_tarjeta: data.id_tarjeta,
        uid_nfc: data.uid_nfc,
        codigo_interno: data.codigo_interno,
        qr_respaldo: data.qr_respaldo || data.codigo_interno,
        metodo_identificacion: (uid_nfc && !qr_code) ? "NFC" : "QR_RESPALDO",
        ya_tiene_sello_hoy: yaTieneSelloHoy,
        monto_por_punto: montoPorPunto,
        puntos_por_visita: puntosPorVisitaLocal,
        cliente: {
          id_cliente: data.id_cliente,
          codigo_cliente: data.codigo_cliente,
          nombres: data.nombres,
          apellidos: data.apellidos,
          foto_perfil: data.foto_perfil,
        },
      }, "Cliente identificado con éxito.");
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
    let client;
    try {
      const { id_tarjeta, id_sucursal, observacion, monto_compra, id_programa } = req.body;
      const validadorId = req.user!.id;

      if (!isValidId(id_tarjeta) || !isValidId(id_sucursal)) {
        throw new ApiError(400, "La tarjeta y la sucursal deben tener identificadores válidos");
      }
      if (id_programa !== undefined && !isValidId(id_programa)) {
        throw new ApiError(400, "El sello seleccionado debe tener un identificador válido");
      }
      if (observacion != null && (typeof observacion !== "string" || observacion.length > 500)) {
        throw new ApiError(400, "La observación debe ser un texto de hasta 500 caracteres");
      }
      if (monto_compra !== undefined && monto_compra !== null && String(monto_compra).trim() !== "" &&
          (typeof monto_compra !== "string" && typeof monto_compra !== "number" || !/^\d+(\.\d{1,2})?$/.test(String(monto_compra)) ||
           !Number.isFinite(Number(monto_compra)) || Number(monto_compra) < 0)) {
        throw new ApiError(400, "Ingresa un monto de compra válido (número positivo con hasta dos decimales)");
      }

      client = await pool.connect();
      await client.query("BEGIN");

      const asignacion = await client.query(
        `SELECT 1 FROM usuario_sucursal
         WHERE id_usuario = $1 AND id_sucursal = $2 AND estado = 1`,
        [validadorId, id_sucursal],
      );
      if (!asignacion.rows.length) {
        throw new ApiError(403, "No tienes permiso para registrar visitas en esta sucursal");
      }

      // Validar tarjeta y cliente activo
      const tarjetaRes = await client.query(
        `SELECT t.id_tarjeta, t.id_cliente, t.estado, c.id_usuario
         FROM tarjetas_nfc t
          JOIN clientes c ON c.id_cliente = t.id_cliente
          JOIN usuarios u ON u.id_usuario = c.id_usuario
          WHERE t.id_tarjeta = $1 AND t.estado = 'ACTIVA' AND u.estado = 1
          FOR UPDATE OF t, c`,
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
      // (o el sello específico elegido por el trabajador si viene id_programa)
      const progParams: any[] = [establecimientoId];
      let progSql = `
        SELECT ps.id_programa, ps.meta_sellos, ps.max_sellos_dia, ps.nombre_sello,
                ps.imagen_sello, ps.color_sello,
                COALESCE(ps.puntos_por_visita, rp.valor, 20) AS puntos_por_sello
         FROM programas_sellos ps
         LEFT JOIN reglas_puntos rp ON rp.id_programa = ps.id_programa AND rp.tipo_regla = 'POR_SELLO' AND rp.estado = 1
         WHERE ps.id_establecimiento = $1 AND ps.estado = 'ACTIVO'`;
      if (id_programa !== undefined) {
        progParams.push(id_programa);
        progSql += ` AND ps.id_programa = $${progParams.length}`;
      }
      progSql += `
         ORDER BY ps.id_programa DESC
         LIMIT 1
         FOR SHARE OF ps`;
      const progRes = await client.query(progSql, progParams);

      const programa = progRes.rows[0];
      if (!programa) {
        throw new ApiError(400, id_programa !== undefined
          ? "El sello seleccionado no está disponible en este local"
          : "El establecimiento no cuenta con un programa de sellos activo");
      }

      // Validar si el cliente ya recibió un sello hoy en este establecimiento (Zona horaria de Perú)
      const sellosHoyRes = await client.query(
        `SELECT COUNT(*)::int AS total_hoy
         FROM sellos_digitales s
         JOIN visitas v ON v.id_visita = s.id_visita
         JOIN sucursales suc ON suc.id_sucursal = v.id_sucursal
         WHERE v.id_cliente = $1 AND suc.id_establecimiento = $2 
           AND s.estado = 'OTORGADO'
           AND s.fecha_otorgamiento >= (date_trunc('day', now() AT TIME ZONE 'America/Lima') AT TIME ZONE 'America/Lima')`,
        [clienteId, establecimientoId],
      );
      const yaTieneSelloHoy = (sellosHoyRes.rows[0]?.total_hoy || 0) >= 1;

      const metodo = (req.body.metodo_validacion === "QR" || req.body.metodo_validacion === "QR_RESPALDO") ? "QR" : "NFC";

      // 1. Crear Visita Confirmada
      const visitaRes = await client.query(
        `INSERT INTO visitas (id_cliente, id_tarjeta, id_sucursal, id_usuario_validador, estado, observacion, metodo_validacion)
         VALUES ($1, $2, $3, $4, 'CONFIRMADA', $5, $6)
         RETURNING id_visita, fecha_hora`,
        [
          clienteId,
          id_tarjeta,
          id_sucursal,
          validadorId,
          (monto_compra !== undefined && monto_compra !== null && String(monto_compra).trim() !== "" && Number(monto_compra) > 0)
            ? `Compra S/ ${Number(monto_compra).toFixed(2)}`
            : observacion || null,
          metodo,
        ],
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

      // Obtener monto_por_punto configurado en el establecimiento
      const estConfigRes = await client.query(
        `SELECT monto_por_punto FROM establecimientos WHERE id_establecimiento = $1`,
        [establecimientoId],
      );
      const ratioMontoPorPunto = Number(estConfigRes.rows[0]?.monto_por_punto) > 0
        ? Number(estConfigRes.rows[0].monto_por_punto)
        : 10;

      // 1. Puntos Base (solo si no ha recibido sello hoy)
      const puntosBase = !yaTieneSelloHoy ? (Number(programa.puntos_por_sello) || 0) : 0;

      // 2. Bono por Frecuencia (visitas en los últimos 7 días a este establecimiento)
      const visitasRecientesRes = await client.query(
        `SELECT COUNT(*)::int AS total
         FROM visitas v
         JOIN sucursales s ON s.id_sucursal = v.id_sucursal
         WHERE v.id_cliente = $1 
           AND s.id_establecimiento = $2
           AND v.estado = 'CONFIRMADA'
           AND v.fecha_hora >= (CURRENT_TIMESTAMP - INTERVAL '7 days')`,
        [clienteId, establecimientoId],
      );
      const visitasPrevias7d = visitasRecientesRes.rows[0]?.total || 0;
      let bonoFrecuencia = 0;
      let tagFrecuencia = "";
      if (visitasPrevias7d === 1) {
        bonoFrecuencia = 5; // 2da visita en 7 días
        tagFrecuencia = " (+5 pts bono cliente frecuente)";
      } else if (visitasPrevias7d >= 2) {
        bonoFrecuencia = 10; // 3ra+ visita en 7 días
        tagFrecuencia = " (+10 pts bono racha semanal)";
      }

      // 3. Bono por Consumo / Monto de compra según el ratio configurado por el local
      let bonoConsumo = 0;
      let tagConsumo = "";
      if (monto_compra !== undefined && Number(monto_compra) > 0 && ratioMontoPorPunto > 0) {
        const montoNum = Number(monto_compra);
        bonoConsumo = Math.floor(montoNum / ratioMontoPorPunto);
        if (bonoConsumo > 0) {
          tagConsumo = ` (+${bonoConsumo} pts por consumo S/ ${montoNum.toFixed(2)})`;
        }
      }

      // 4. Puntos de Regalo / Cortesía opcionales ingresados por el cajero
      const puntosRegalo = (req.body.puntos_regalo && !isNaN(Number(req.body.puntos_regalo)))
        ? Math.max(0, Math.floor(Number(req.body.puntos_regalo)))
        : 0;
      const tagRegalo = puntosRegalo > 0 ? ` (+${puntosRegalo} pts de cortesía)` : "";

      const puntosOtorgados = puntosBase + bonoFrecuencia + bonoConsumo + puntosRegalo;

      let selloId: number | null = null;

      // 2. Crear Sello Digital solo si no tiene sello de hoy
      if (!yaTieneSelloHoy) {
        const selloRes = await client.query(
          `INSERT INTO sellos_digitales (
             id_visita, id_programa, numero_sello, cantidad, estado,
             nombre_sello_snapshot, imagen_sello_snapshot, color_sello_snapshot,
             meta_sellos_snapshot, puntos_sello_snapshot
           )
           VALUES ($1, $2, $3, 1, 'OTORGADO', $4, $5, $6, $7, $8)
           RETURNING id_sello, numero_sello`,
          [
            visitaId,
            programa.id_programa,
            ordenSello,
            programa.nombre_sello,
            programa.imagen_sello,
            programa.color_sello,
            programa.meta_sellos,
            puntosOtorgados,
          ],
        );
        selloId = selloRes.rows[0].id_sello;
      }

      // 3. Obtener saldo anterior del ledger
      const saldoRes = await client.query(
        `SELECT COALESCE(SUM(cantidad), 0)::int AS saldo
         FROM movimientos_puntos
         WHERE id_cliente = $1`,
        [clienteId],
      );
      const saldoAnterior = saldoRes.rows[0].saldo;
      const saldoPosterior = saldoAnterior + puntosOtorgados;

      const descripcionMovimiento = yaTieneSelloHoy
        ? `Consumo en ${sucursalRes.rows[0].nombre_comercial} (${sucursalRes.rows[0].sucursal_nombre})${tagConsumo}${tagFrecuencia}${tagRegalo}`
        : `Visita a ${sucursalRes.rows[0].nombre_comercial} (${sucursalRes.rows[0].sucursal_nombre})${tagFrecuencia}${tagConsumo}${tagRegalo}`;

      // 4. Crear Movimiento Contable de Puntos (Ledger) si se otorgaron puntos
      if (puntosOtorgados > 0) {
        await client.query(
          `INSERT INTO movimientos_puntos (
            id_cliente, id_programa, id_visita, id_sello,
            tipo_movimiento, cantidad, saldo_anterior, saldo_posterior,
            descripcion, id_usuario_accion
          ) VALUES (
            $1, $2, $3, $4,
            $5, $6, $7, $8,
            $9, $10
          )`,
          [
            clienteId,
            programa.id_programa,
            visitaId,
            selloId,
            yaTieneSelloHoy ? "GANANCIA_COMPRA" : "GANANCIA_SELLO",
            puntosOtorgados,
            saldoAnterior,
            saldoPosterior,
            descripcionMovimiento,
            validadorId,
          ],
        );
      }

      // 5. Crear Notificación para el cliente
      const notifTitulo = yaTieneSelloHoy ? "¡Consumo registrado!" : "¡Nuevo sello obtenido!";
      const notifMensaje = yaTieneSelloHoy
        ? `Se registraron tus compras en ${sucursalRes.rows[0].nombre_comercial} y ganaste +${puntosOtorgados} puntos (el sello diario de hoy ya fue acumulado).`
        : `Has obtenido el sello #${ordenSello} y ganado +${puntosOtorgados} puntos en ${sucursalRes.rows[0].nombre_comercial}.${tagFrecuencia}${tagConsumo}`;

      await client.query(
        `INSERT INTO notificaciones (
          id_usuario, tipo_notificacion, titulo, mensaje, canal, estado_envio, referencia_tipo, referencia_id
        ) VALUES (
          $1, 'SELLO_OBTENIDO', $2,
          $3, 'APP', 'ENVIADA', 'VISITA', $4
        )`,
        [
          tarjetaRes.rows[0].id_usuario,
          notifTitulo,
          notifMensaje,
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
          `Confirmación de visita para cliente ${clienteId} en sucursal ${id_sucursal} (Sello: ${!yaTieneSelloHoy}, Puntos: ${puntosOtorgados})`,
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
        sello_otorgado: !yaTieneSelloHoy,
        sello: !yaTieneSelloHoy ? {
          id_sello: selloId,
          numero_sello: ordenSello,
          meta_sellos: programa.meta_sellos,
          nombre_sello: programa.nombre_sello,
        } : null,
        mensaje_sello: yaTieneSelloHoy
          ? "Sello diario ya acumulado hoy (1/1). Puntos por consumo acreditados."
          : `¡Sello #${ordenSello} otorgado con éxito!`,
        puntos: {
          puntos_ganados: puntosOtorgados,
          saldo_actual: saldoPosterior,
          desglose: {
            puntos_base: puntosBase,
            bono_frecuencia: bonoFrecuencia,
            bono_consumo: bonoConsumo,
          },
        },
      }, yaTieneSelloHoy ? "Compra confirmada y puntos acreditados." : "Visita confirmada, sello y puntos acreditados.");
    } catch (error) {
      if (client) await client.query("ROLLBACK");
      next(error);
    } finally {
      client?.release();
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

  async personalizarTarjeta(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const idUsuario = req.user!.id;
      const { imagen_fondo, color_tema, qr_data } = req.body;

      const tar = await query(
        `SELECT t.id_tarjeta FROM tarjetas_nfc t
         JOIN clientes c ON c.id_cliente = t.id_cliente
         WHERE c.id_usuario = $1 AND t.estado = 'ACTIVA'
         ORDER BY t.es_principal DESC, t.id_tarjeta DESC LIMIT 1`,
        [idUsuario],
      );
      if (!tar.rows[0]) throw new ApiError(404, "No tienes una tarjeta NFC activa");

      const idTarjeta = tar.rows[0].id_tarjeta;
      const result = await query(
        `INSERT INTO tarjeta_nfc_personalizacion (id_tarjeta, imagen_fondo, color_tema, qr_data, fecha_actualizacion)
         VALUES ($1, $2, COALESCE($3, '#7C0A1E'), $4, CURRENT_TIMESTAMP)
         ON CONFLICT (id_tarjeta) DO UPDATE SET
           imagen_fondo = COALESCE($2, tarjeta_nfc_personalizacion.imagen_fondo),
           color_tema = COALESCE($3, tarjeta_nfc_personalizacion.color_tema),
           qr_data = COALESCE($4, tarjeta_nfc_personalizacion.qr_data),
           fecha_actualizacion = CURRENT_TIMESTAMP
         RETURNING *`,
        [idTarjeta, imagen_fondo || null, color_tema || null, qr_data || null],
      );
      sendResponse(res, 200, result.rows[0], "Personalización guardada");
    } catch (error) {
      next(error);
    }
  },

  async obtenerPersonalizacion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const idUsuario = req.user!.id;
      const result = await query(
        `SELECT p.*, t.codigo_interno, t.uid_nfc, t.qr_respaldo
         FROM tarjetas_nfc t
         JOIN clientes c ON c.id_cliente = t.id_cliente
         LEFT JOIN tarjeta_nfc_personalizacion p ON p.id_tarjeta = t.id_tarjeta
         WHERE c.id_usuario = $1 AND t.estado = 'ACTIVA'
         ORDER BY t.es_principal DESC LIMIT 1`,
        [idUsuario],
      );
      sendResponse(res, 200, result.rows[0] || null);
    } catch (error) {
      next(error);
    }
  },

  /**
   * 4. AUTO-SELLADO PARA LUGARES TURÍSTICOS / REGISTRADOS
   * Valida coordenadas geográficas (GPS) y opcionalmente foto de evidencia
   */
  async autosellarVisita(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    let client;
    try {
      const idUsuario = req.user!.id;
      const { id_sucursal, latitud, longitud, foto_evidencia, id_programa } = req.body;

      if (!isValidId(id_sucursal)) {
        throw new ApiError(400, "Identificador de lugar/sucursal inválido");
      }
      if (latitud === undefined || longitud === undefined) {
        throw new ApiError(400, "Se requiere tu ubicación GPS para verificar que estás en el lugar");
      }

      const latCliente = Number(latitud);
      const lngCliente = Number(longitud);
      if (!Number.isFinite(latCliente) || !Number.isFinite(lngCliente)) {
        throw new ApiError(400, "Coordenadas GPS no válidas");
      }

      client = await pool.connect();
      await client.query("BEGIN");

      // Buscar cliente y su tarjeta activa (si tiene)
      const cliRes = await client.query(
        `SELECT c.id_cliente, t.id_tarjeta
         FROM clientes c
         LEFT JOIN tarjetas_nfc t ON t.id_cliente = c.id_cliente AND t.estado = 'ACTIVA'
         WHERE c.id_usuario = $1`,
        [idUsuario]
      );
      if (!cliRes.rows[0]) {
        throw new ApiError(404, "Cuenta de cliente no encontrada");
      }
      const clienteId = cliRes.rows[0].id_cliente;
      const idTarjeta = cliRes.rows[0].id_tarjeta || null;

      // Obtener lugar y validar que permita autosellado
      const sucRes = await client.query(
        `SELECT s.id_sucursal, s.id_establecimiento, s.nombre AS sucursal_nombre,
                s.latitud, s.longitud, s.permite_autosellado, s.radio_tolerancia_metros, s.requiere_foto,
                e.nombre_comercial, e.estado AS est_estado
         FROM sucursales s
         JOIN establecimientos e ON e.id_establecimiento = s.id_establecimiento
         WHERE s.id_sucursal = $1 AND s.estado = 1 AND e.estado = 'ACTIVO'`,
        [id_sucursal]
      );
      const suc = sucRes.rows[0];
      if (!suc) {
        throw new ApiError(404, "El lugar no se encuentra disponible");
      }
      if (suc.permite_autosellado !== 1) {
        throw new ApiError(400, "Este lugar no tiene habilitado el auto-sellado por visitante. Debe ser validado por personal.");
      }
      if (!suc.latitud || !suc.longitud) {
        throw new ApiError(400, "Este lugar no cuenta con coordenadas GPS configuradas");
      }

      // Validar si requiere foto
      if (suc.requiere_foto === 1 && !foto_evidencia) {
        throw new ApiError(400, "Este lugar turístico requiere una foto comprobatoria para auto-sellar");
      }

      // Cálculo de distancia Haversine en metros
      const R = 6371e3; // Radio de la Tierra en metros
      const lat1 = (latCliente * Math.PI) / 180;
      const lat2 = (Number(suc.latitud) * Math.PI) / 180;
      const deltaLat = ((Number(suc.latitud) - latCliente) * Math.PI) / 180;
      const deltaLon = ((Number(suc.longitud) - lngCliente) * Math.PI) / 180;

      const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanciaMetros = Math.round(R * c);

      const radioMax = suc.radio_tolerancia_metros || 200;
      if (distanciaMetros > radioMax) {
        throw new ApiError(
          400,
          `Estás a ${distanciaMetros} metros del lugar. Debes estar a menos de ${radioMax} metros para auto-sellar tu visita.`
        );
      }

      // Obtener programa de sellos activo
      const progParams: any[] = [suc.id_establecimiento];
      let progSql = `
        SELECT ps.id_programa, ps.meta_sellos, ps.max_sellos_dia, ps.nombre_sello,
               ps.imagen_sello, ps.color_sello,
               COALESCE(ps.puntos_por_visita, rp.valor, 25) AS puntos_por_sello
        FROM programas_sellos ps
        LEFT JOIN reglas_puntos rp ON rp.id_programa = ps.id_programa AND rp.tipo_regla = 'POR_SELLO' AND rp.estado = 1
        WHERE ps.id_establecimiento = $1 AND ps.estado = 'ACTIVO'`;
      if (id_programa !== undefined && isValidId(id_programa)) {
        progParams.push(id_programa);
        progSql += ` AND ps.id_programa = $${progParams.length}`;
      }
      progSql += ` ORDER BY ps.id_programa DESC LIMIT 1 FOR SHARE OF ps`;
      const progRes = await client.query(progSql, progParams);
      const programa = progRes.rows[0];

      if (!programa) {
        throw new ApiError(400, "Este lugar no cuenta con un programa de sellos activo en este momento");
      }

      // Validar límite diario para este cliente
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
          throw new ApiError(400, `Ya alcanzaste el límite de ${programa.max_sellos_dia} sello(s) por día en este destino.`);
        }
      }

      // 1. Crear Visita con método AUTOSELLADO
      const visitaRes = await client.query(
        `INSERT INTO visitas (
           id_cliente, id_tarjeta, id_sucursal, id_usuario_validador,
           estado, observacion, metodo_validacion, foto_evidencia, latitud_registro, longitud_registro
         )
         VALUES ($1, $2, $3, NULL, 'CONFIRMADA', $4, 'AUTOSELLADO', $5, $6, $7)
         RETURNING id_visita, fecha_hora`,
        [
          clienteId,
          idTarjeta,
          id_sucursal,
          `Auto-sellado turístico a ${distanciaMetros}m de distancia`,
          foto_evidencia || null,
          latCliente,
          lngCliente,
        ],
      );
      const visitaId = visitaRes.rows[0].id_visita;

      // 2. Calcular Puntos y Crear Sello Digital
      const totalSellosRes = await client.query(
        `SELECT COUNT(*)::int AS total
         FROM sellos_digitales
         WHERE id_programa = $1 AND estado = 'OTORGADO'
           AND id_visita IN (SELECT id_visita FROM visitas WHERE id_cliente = $2)`,
        [programa.id_programa, clienteId],
      );
      const ordenSello = (totalSellosRes.rows[0].total % programa.meta_sellos) + 1;

      // Puntos base
      const puntosBase = Number(programa.puntos_por_sello) || 25;

      // Bono por frecuencia (visitas previas en 7 días a este establecimiento)
      const visitasRecientesRes = await client.query(
        `SELECT COUNT(*)::int AS total
         FROM visitas v
         JOIN sucursales s ON s.id_sucursal = v.id_sucursal
         WHERE v.id_cliente = $1 
           AND s.id_establecimiento = $2
           AND v.estado = 'CONFIRMADA'
           AND v.fecha_hora >= (CURRENT_TIMESTAMP - INTERVAL '7 days')`,
        [clienteId, suc.id_establecimiento],
      );
      const visitasPrevias7d = visitasRecientesRes.rows[0]?.total || 0;
      let bonoFrecuencia = 0;
      let tagFrecuencia = "";
      if (visitasPrevias7d === 1) {
        bonoFrecuencia = 5;
        tagFrecuencia = " (+5 pts bono visitante frecuente)";
      } else if (visitasPrevias7d >= 2) {
        bonoFrecuencia = 10;
        tagFrecuencia = " (+10 pts bono racha semanal)";
      }

      const puntosOtorgados = puntosBase + bonoFrecuencia;

      const selloRes = await client.query(
        `INSERT INTO sellos_digitales (
           id_visita, id_programa, numero_sello, cantidad, estado,
           nombre_sello_snapshot, imagen_sello_snapshot, color_sello_snapshot,
           meta_sellos_snapshot, puntos_sello_snapshot
         )
         VALUES ($1, $2, $3, 1, 'OTORGADO', $4, $5, $6, $7, $8)
         RETURNING id_sello, numero_sello`,
        [
          visitaId,
          programa.id_programa,
          ordenSello,
          programa.nombre_sello,
          programa.imagen_sello,
          programa.color_sello,
          programa.meta_sellos,
          puntosOtorgados,
        ],
      );
      const selloId = selloRes.rows[0].id_sello;

      // 3. Registrar en Ledger de Puntos
      const saldoRes = await client.query(
        `SELECT COALESCE(SUM(cantidad), 0)::int AS saldo FROM movimientos_puntos WHERE id_cliente = $1`,
        [clienteId],
      );
      const saldoAnterior = saldoRes.rows[0].saldo;
      const saldoPosterior = saldoAnterior + puntosOtorgados;

      const descripAutosello = `Auto-sellado en ${suc.nombre_comercial} (${suc.sucursal_nombre})${tagFrecuencia}`;

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
          descripAutosello,
          idUsuario,
        ],
      );

      // 4. Notificación para el usuario
      await client.query(
        `INSERT INTO notificaciones (
          id_usuario, tipo_notificacion, titulo, mensaje, canal, estado_envio, referencia_tipo, referencia_id
        ) VALUES (
          $1, 'SELLO_OBTENIDO', '¡Sello Turístico Desbloqueado!',
          $2, 'APP', 'ENVIADA', 'VISITA', $3
        )`,
        [
          idUsuario,
          `¡Felicidades! Has sellado tu pasaporte en ${suc.nombre_comercial} y ganado +${puntosOtorgados} puntos.${tagFrecuencia}`,
          visitaId,
        ],
      );

      await client.query("COMMIT");

      sendResponse(res, 201, {
        visita: {
          id_visita: visitaId,
          fecha_hora: visitaRes.rows[0].fecha_hora,
          sucursal: suc.sucursal_nombre,
          establecimiento: suc.nombre_comercial,
          distancia_metros: distanciaMetros,
        },
        sello: {
          id_sello: selloId,
          numero_sello: ordenSello,
          meta_sellos: programa.meta_sellos,
          nombre_sello: programa.nombre_sello,
          color_sello: programa.color_sello,
          imagen_sello: programa.imagen_sello,
        },
        puntos: {
          puntos_ganados: puntosOtorgados,
          saldo_actual: saldoPosterior,
        },
      }, "¡Auto-sellado completado con éxito! Tu pasaporte ha sido actualizado.");
    } catch (error) {
      if (client) await client.query("ROLLBACK");
      next(error);
    } finally {
      client?.release();
    }
  },
};

