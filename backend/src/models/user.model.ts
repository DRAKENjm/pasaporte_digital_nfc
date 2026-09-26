import { query } from "../config/database";

export const UserModel = {
  async findByEmail(email: string) {
    const res = await query(
      `SELECT u.*, r.nombre as rol_nombre, c.id_cliente, c.codigo_cliente
       FROM usuarios u
       JOIN roles r ON u.id_rol = r.id_rol
       LEFT JOIN clientes c ON u.id_usuario = c.id_usuario
       WHERE LOWER(u.email) = LOWER($1)`,
      [email],
    );
    return res.rows[0] || null;
  },

  async findById(id: number) {
    const res = await query(
      `SELECT u.id_usuario, u.email, u.nombres, u.apellidos, u.telefono, u.foto_perfil, u.estado, u.fecha_creacion,
              r.nombre as rol_nombre, r.nombre as role,
              c.id_cliente, c.codigo_cliente,
              (
                SELECT COALESCE(SUM(cantidad), 0)::int
                FROM movimientos_puntos
                WHERE id_cliente = c.id_cliente
              ) AS puntos_actuales,
              (
                SELECT COUNT(DISTINCT id_visita)::int
                FROM visitas
                WHERE id_cliente = c.id_cliente AND estado = 'CONFIRMADA'
              ) AS total_visitas,
              (
                SELECT COUNT(*)::int
                FROM sellos_digitales s
                JOIN visitas v ON v.id_visita = s.id_visita
                WHERE v.id_cliente = c.id_cliente AND s.estado = 'OTORGADO'
              ) AS total_sellos,
              (
                SELECT COUNT(DISTINCT id_sucursal)::int
                FROM visitas
                WHERE id_cliente = c.id_cliente AND estado = 'CONFIRMADA'
              ) AS locales_visitados,
              (
                SELECT json_build_object(
                  'id_tarjeta', t.id_tarjeta,
                  'uid_nfc', t.uid_nfc,
                  'codigo_interno', t.codigo_interno,
                  'estado', t.estado
                )
                FROM tarjetas_nfc t
                WHERE t.id_cliente = c.id_cliente AND t.estado = 'ACTIVA'
                ORDER BY t.fecha_activacion DESC
                LIMIT 1
              ) AS tarjeta_activa
       FROM usuarios u
       JOIN roles r ON u.id_rol = r.id_rol
       LEFT JOIN clientes c ON u.id_usuario = c.id_usuario
       WHERE u.id_usuario = $1`,
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
    telefono?: string,
  ) {
    const roleRes = await query(
      `SELECT id_rol, nombre FROM roles 
       WHERE nombre = $1 
          OR ($1 = 'ADMIN' AND nombre = 'ADMIN_GENERAL')
          OR ($1 = 'COMERCIO' AND nombre = 'ADMIN_LOCAL')
       LIMIT 1`,
      [roleName],
    );
    if (roleRes.rows.length === 0) {
      throw new Error(`El rol ${roleName} no existe.`);
    }
    const idRol = roleRes.rows[0].id_rol;

    // 1. Insertar usuario
    const userRes = await query(
      `INSERT INTO usuarios (id_rol, email, password_hash, nombres, apellidos, telefono, estado)
       VALUES ($1, $2, $3, $4, $5, $6, 1)
       RETURNING id_usuario, email, nombres, apellidos, estado, fecha_creacion`,
      [idRol, email, passwordHash, nombres, apellidos, telefono || null],
    );

    const newUser = userRes.rows[0];

    // 2. Si es CLIENTE, crear extensión de cliente automáticamente
    let idCliente = null;
    let codigoCliente = null;
    if (roleName === "CLIENTE") {
      codigoCliente = `CLI-${Date.now().toString().slice(-6)}`;
      const clienteRes = await query(
        `INSERT INTO clientes (id_usuario, codigo_cliente, estado)
         VALUES ($1, $2, 1)
         RETURNING id_cliente, codigo_cliente`,
        [newUser.id_usuario, codigoCliente],
      );
      idCliente = clienteRes.rows[0].id_cliente;
    }

    return {
      ...newUser,
      rol_nombre: roleName,
      id_cliente: idCliente,
      codigo_cliente: codigoCliente,
    };
  },

  async updateUltimoAcceso(idUsuario: number) {
    await query(
      `UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id_usuario = $1`,
      [idUsuario],
    );
  },
};
