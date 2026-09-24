import { query } from "../config/database";

export const UserModel = {
  async findByEmail(email: string) {
    const res = await query(
      `SELECT u.*, r.nombre as rol_nombre, n.nombre_rango as nivel_nombre
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       LEFT JOIN niveles_pasaporte n ON u.nivel_id = n.id
       WHERE u.email = $1`,
      [email],
    );
    return res.rows[0] || null;
  },

  async findById(id: string) {
    const res = await query(
      `SELECT u.id, u.email, u.nombres, u.apellidos, r.nombre as rol_nombre, r.nombre as rol,
              u.total_sellos, u.puntos_globales, u.estado, u.created_at, u.username,u.avatar_url,
              (SELECT uid_nfc FROM tarjetas_nfc WHERE usuario_id=u.id AND estado='ASIGNADA' ORDER BY fecha_asignacion DESC LIMIT 1) AS uid_nfc,
              n.nombre_rango as nivel_nombre, n.color_hex as nivel_color
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       LEFT JOIN niveles_pasaporte n ON u.nivel_id = n.id
       WHERE u.id = $1`,
      [id],
    );
    return res.rows[0] || null;
  },

  async createUser(
    email: string,
    passwordHash: string,
    nombres: string,
    apellidos: string,
    roleName: string = "CLIENTE",
  ) {
    const roleRes = await query("SELECT id FROM roles WHERE nombre = $1", [
      roleName,
    ]);
    if (roleRes.rows.length === 0) {
      throw new Error(
        `El rol ${roleName} no existe. Ejecuta el seed de roles.`,
      );
    }
    const rolId = roleRes.rows[0].id;

    const nivelRes = await query(
      "SELECT id FROM niveles_pasaporte WHERE nombre_rango = 'Bronce' LIMIT 1",
    );
    const nivelId = nivelRes.rows[0]?.id || null;

    const res = await query(
      `INSERT INTO usuarios (rol_id, nivel_id, nombres, apellidos, email, password_hash, aceptacion_tyc)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       RETURNING id, email, nombres, apellidos, total_sellos, puntos_globales, created_at`,
      [rolId, nivelId, nombres, apellidos, email, passwordHash],
    );

    return { ...res.rows[0], rol_nombre: roleName };
  },

  async updatePuntosYSellos(
    usuarioId: string,
    sellosDelta: number,
    puntosDelta: number,
  ) {
    const res = await query(
      `UPDATE usuarios
       SET total_sellos = total_sellos + $2,
           puntos_globales = puntos_globales + $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING total_sellos, puntos_globales`,
      [usuarioId, sellosDelta, puntosDelta],
    );
    return res.rows[0];
  },

  async updateNivelIfNeeded(usuarioId: string) {
    // Sube de nivel automáticamente según sellos
    await query(
      `UPDATE usuarios u
       SET nivel_id = (
         SELECT n.id FROM niveles_pasaporte n
         WHERE n.sellos_requeridos <= u.total_sellos AND n.estado = TRUE
         ORDER BY n.sellos_requeridos DESC
         LIMIT 1
       )
       WHERE u.id = $1`,
      [usuarioId],
    );
  },

  async verifyEmail(id: string) {
    const res = await query(
      `UPDATE usuarios SET email_verificado = TRUE WHERE id = $1 RETURNING id`,
      [id],
    );
    return res.rows[0];
  },
};
