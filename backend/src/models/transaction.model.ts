import { query } from '../config/database';

export const TransactionModel = {
  async registrarVisita(data: {
    usuario_id: string;
    establecimiento_id: string;
    personal_validador_id?: string | null;
    regla_sello_id?: string | null;
    puntos_ganados: number;
    metodo_validacion: 'NFC' | 'QR' | 'MANUAL_DASHBOARD';
    ip_registro?: string | null;
  }) {
    const res = await query(
      `INSERT INTO historial_visitas_sellos
         (usuario_id, establecimiento_id, personal_validador_id, regla_sello_id,
          puntos_ganados, metodo_validacion, ip_registro)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.usuario_id,
        data.establecimiento_id,
        data.personal_validador_id || null,
        data.regla_sello_id || null,
        data.puntos_ganados,
        data.metodo_validacion,
        data.ip_registro || null,
      ]
    );
    return res.rows[0];
  },

  async contarVisitasHoy(usuarioId: string, establecimientoId: string) {
    const res = await query(
      `SELECT COUNT(*)::int AS total
       FROM historial_visitas_sellos
       WHERE usuario_id = $1
         AND establecimiento_id = $2
         AND fecha_hora >= CURRENT_DATE`,
      [usuarioId, establecimientoId]
    );
    return res.rows[0].total as number;
  },

  async historialUsuario(usuarioId: string, limit = 50) {
    const res = await query(
      `SELECT h.*, e.razon_social AS establecimiento_nombre
       FROM historial_visitas_sellos h
       JOIN establecimientos e ON e.id = h.establecimiento_id
       WHERE h.usuario_id = $1
       ORDER BY h.fecha_hora DESC
       LIMIT $2`,
      [usuarioId, limit]
    );
    return res.rows;
  },

  async getReglaActiva(establecimientoId: string) {
    const res = await query(
      `SELECT * FROM reglas_sellos
       WHERE establecimiento_id = $1 AND estado = 'ACTIVA'
       ORDER BY created_at DESC
       LIMIT 1`,
      [establecimientoId]
    );
    return res.rows[0] || null;
  },

  async findTarjetaByUid(uid: string) {
    const res = await query(
      `SELECT t.*, u.nombres, u.apellidos, u.email, u.total_sellos, u.puntos_globales
       FROM tarjetas_nfc t
       LEFT JOIN usuarios u ON u.id = t.usuario_id
       WHERE t.uid_nfc = $1`,
      [uid]
    );
    return res.rows[0] || null;
  },

  async asignarTarjeta(uid: string, usuarioId: string, qrRespaldo: string) {
    const res = await query(
      `INSERT INTO tarjetas_nfc (usuario_id, uid_nfc, qr_respaldo, estado, fecha_asignacion)
       VALUES ($1, $2, $3, 'ASIGNADA', CURRENT_TIMESTAMP)
       ON CONFLICT (uid_nfc) DO UPDATE
         SET usuario_id = EXCLUDED.usuario_id,
             estado = 'ASIGNADA',
             fecha_asignacion = CURRENT_TIMESTAMP
       RETURNING *`,
      [usuarioId, uid, qrRespaldo]
    );
    return res.rows[0];
  },
};
