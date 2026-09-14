import { query } from '../config/database';

// Nota: Asegúrate de actualizar tu interface UserDB en '../types' 
// para que use 'nombres', 'apellidos', 'rol_nombre', etc.

export const UserModel = {
  async findByEmail(email: string) {
    const res = await query(
      `SELECT u.*, r.nombre as rol_nombre 
       FROM usuarios u 
       JOIN roles r ON u.rol_id = r.id 
       WHERE u.email = $1`, 
      [email]
    );
    return res.rows[0] || null;
  },

  async findById(id: string) {
    const res = await query(
      `SELECT u.id, u.email, u.nombres, u.apellidos, r.nombre as rol_nombre, 
              u.total_sellos, u.puntos_globales, u.created_at 
       FROM usuarios u 
       JOIN roles r ON u.rol_id = r.id 
       WHERE u.id = $1`, 
      [id]
    );
    return res.rows[0] || null;
  },

  async createUser(email: string, passwordHash: string, nombres: string, apellidos: string, roleName: string = 'CLIENTE') {
    // 1. Obtener el ID del rol (Ej: 'CLIENTE', 'ADMIN', 'COMERCIO')
    const roleRes = await query('SELECT id FROM roles WHERE nombre = $1', [roleName]);
    if (roleRes.rows.length === 0) {
        throw new Error(`El rol ${roleName} no existe en la tabla roles. Debes insertarlo primero en la base de datos.`);
    }
    const rolId = roleRes.rows[0].id;

    // 2. Obtener el ID del nivel inicial por defecto ('Bronce')
    const nivelRes = await query('SELECT id FROM niveles_pasaporte WHERE nombre_rango = $1', ['Bronce']);
    const nivelId = nivelRes.rows.length > 0 ? nivelRes.rows[0].id : null;

    // 3. Insertar el nuevo usuario en la base de datos
    const res = await query(
      `INSERT INTO usuarios (rol_id, nivel_id, nombres, apellidos, email, password_hash, aceptacion_tyc)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, nombres, apellidos, total_sellos, puntos_globales, created_at`,
      [rolId, nivelId, nombres, apellidos, email, passwordHash, true]
    );

    const user = res.rows[0];

    // Se retorna el usuario con el nombre del rol adjunto para facilitar la creación del token JWT en el controlador
    return { ...user, rol_nombre: roleName };
  },
};