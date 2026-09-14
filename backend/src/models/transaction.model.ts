import { query } from '../config/database';

export const TransactionModel = {
  // 1. Identificar al usuario escaneando su pasaporte (NFC o QR de respaldo)
  async findTarjeta(identificador: string, tipo: 'NFC' | 'QR') {
    const campo = tipo === 'NFC' ? 'uid_nfc' : 'qr_respaldo';
    const res = await query(
      `SELECT t.*, u.id as usuario_id 
       FROM tarjetas_nfc t
       JOIN usuarios u ON t.usuario_id = u.id
       WHERE t.${campo} = $1 AND t.estado = 'ASIGNADA'`,
      [identificador]
    );
    return res.rows[0] || null;
  },

  // 2. Obtener la regla activa del comercio para saber cuántos puntos dar
  async getReglaActiva(establecimientoId: string) {
    const res = await query(
      `SELECT * FROM reglas_sellos 
       WHERE establecimiento_id = $1 AND estado = 'ACTIVA' LIMIT 1`,
      [establecimientoId]
    );
    return res.rows[0] || null;
  },

  // 3. Control antifraude: Contar visitas de hoy para ese usuario en ese local
  async contarVisitasHoy(usuarioId: string, establecimientoId: string) {
    const res = await query(
      `SELECT COUNT(*) as conteo 
       FROM historial_visitas_sellos 
       WHERE usuario_id = $1 
         AND establecimiento_id = $2 
         AND DATE(fecha_hora) = CURRENT_DATE`,
      [usuarioId, establecimientoId]
    );
    return parseInt(res.rows[0].conteo, 10);
  },

  // 4. Registrar la visita y sumar los puntos al usuario
  async procesarValidacion(
    usuarioId: string, 
    establecimientoId: string, 
    personalId: string,
    reglaId: string,
    puntosGanados: number,
    metodo: string
  ) {
    // A) Registramos el historial de la visita con el validador
    const insertRes = await query(
      `INSERT INTO historial_visitas_sellos 
        (usuario_id, establecimiento_id, personal_validador_id, regla_sello_id, puntos_ganados, metodo_validacion)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, fecha_hora`,
      [usuarioId, establecimientoId, personalId, reglaId, puntosGanados, metodo]
    );

    // B) Sumamos 1 sello y los puntos correspondientes a la billetera integrada del usuario
    await query(
      `UPDATE usuarios 
       SET total_sellos = total_sellos + 1, 
           puntos_globales = puntos_globales + $1
       WHERE id = $2`,
      [puntosGanados, usuarioId]
    );

    return insertRes.rows[0];
  },

  // 5. Obtener el historial de un usuario
  async getHistorialUsuario(usuarioId: string) {
    const res = await query(
      `SELECT h.id, h.fecha_hora, h.puntos_ganados, e.razon_social as comercio
       FROM historial_visitas_sellos h
       JOIN establecimientos e ON h.establecimiento_id = e.id
       WHERE h.usuario_id = $1
       ORDER BY h.fecha_hora DESC`,
      [usuarioId]
    );
    return res.rows;
  }
};