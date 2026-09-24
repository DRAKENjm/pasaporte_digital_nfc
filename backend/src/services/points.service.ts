import { pool } from "../config/database";
import { ApiError } from "../utils";
export const PointsService = {
  async validarYAcreditar(p: {
    usuarioId: string;
    establecimientoId: string;
    personalValidadorId?: string | null;
    metodo: "NFC" | "QR" | "MANUAL_DASHBOARD";
    ip?: string | null;
    jti?: string;
    exp?: number;
  }) {
    const c = await pool.connect();
    try {
      await c.query("BEGIN");
      const validator = await c.query(
        `SELECT r.nombre FROM usuarios u JOIN roles r ON r.id=u.rol_id WHERE u.id=$1 AND u.estado='ACTIVO'`,
        [p.personalValidadorId],
      );
      if (validator.rows[0]?.nombre !== "ADMIN") {
        const staff = await c.query(
          "SELECT id FROM personal_establecimiento WHERE usuario_id=$1 AND establecimiento_id=$2 AND estado=TRUE",
          [p.personalValidadorId, p.establecimientoId],
        );
        if (validator.rows[0]?.nombre !== "COMERCIO" || !staff.rowCount)
          throw new ApiError(403, "No estás asignado a este establecimiento");
      }
      const user = await c.query(
        "SELECT * FROM usuarios WHERE id=$1 AND estado='ACTIVO' FOR UPDATE",
        [p.usuarioId],
      );
      if (!user.rowCount) throw new ApiError(404, "Cliente no disponible");
      const rules = await c.query(
        `SELECT r.* FROM reglas_sellos r JOIN establecimientos e ON e.id=r.establecimiento_id WHERE r.establecimiento_id=$1 AND r.estado='ACTIVA' AND e.estado='ACTIVO' AND (r.fecha_inicio IS NULL OR r.fecha_inicio<=now()) AND (r.fecha_fin IS NULL OR r.fecha_fin>now()) ORDER BY r.created_at DESC LIMIT 1`,
        [p.establecimientoId],
      );
      const regla = rules.rows[0];
      if (!regla) throw new ApiError(400, "El local no tiene una regla activa");
      const visits = await c.query(
        `SELECT count(*)::int AS total FROM historial_visitas_sellos WHERE usuario_id=$1 AND establecimiento_id=$2 AND fecha_hora>=date_trunc('day',now() AT TIME ZONE 'America/Lima') AT TIME ZONE 'America/Lima'`,
        [p.usuarioId, p.establecimientoId],
      );
      if (visits.rows[0].total >= regla.limite_diario_por_usuario)
        throw new ApiError(429, "Límite diario de sellos alcanzado");
      if (p.jti) {
        const used = await c.query(
          "INSERT INTO qr_consumidos(jti,expires_at) VALUES($1,to_timestamp($2)) ON CONFLICT DO NOTHING RETURNING jti",
          [p.jti, p.exp],
        );
        if (!used.rowCount)
          throw new ApiError(
            409,
            "Este QR ya se utilizó. Pide al cliente que lo renueve",
          );
      }
      const puntos = regla.valor_puntos_por_sello;
      const visit = await c.query(
        `INSERT INTO historial_visitas_sellos(usuario_id,establecimiento_id,personal_validador_id,regla_sello_id,puntos_ganados,metodo_validacion,ip_registro) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [
          p.usuarioId,
          p.establecimientoId,
          p.personalValidadorId,
          regla.id,
          puntos,
          p.metodo,
          p.ip,
        ],
      );
      await c.query(
        "UPDATE usuarios SET total_sellos=total_sellos+1,puntos_globales=puntos_globales+$2,updated_at=now() WHERE id=$1",
        [p.usuarioId, puntos],
      );
      await c.query(
        "UPDATE usuarios u SET nivel_id=(SELECT id FROM niveles_pasaporte WHERE estado=TRUE AND sellos_requeridos<=u.total_sellos ORDER BY sellos_requeridos DESC LIMIT 1) WHERE u.id=$1",
        [p.usuarioId],
      );
      const updated = await c.query(
        "SELECT id,nombres,apellidos,puntos_globales,total_sellos FROM usuarios WHERE id=$1",
        [p.usuarioId],
      );
      await c.query("COMMIT");
      return {
        visita: visit.rows[0],
        usuario: updated.rows[0],
        puntos_acreditados: puntos,
      };
    } catch (e) {
      await c.query("ROLLBACK");
      throw e;
    } finally {
      c.release();
    }
  },
};
