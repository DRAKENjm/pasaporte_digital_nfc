import { Response, NextFunction } from "express";
import { query } from "../config/database";
import { ApiError, sendResponse, hashPassword } from "../utils";
import { AuthenticatedRequest } from "../types";
import { UserModel } from "../models/user.model";

export const AdminController = {
  /** Dashboard: contadores generales */
  async dashboard(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      // Consultas adaptadas al esquema oficial de 23 tablas
      const batch1 = await Promise.all([
        query(`SELECT COUNT(*)::int AS total FROM clientes`),
        query(
          `SELECT COUNT(*)::int AS total,
                  COUNT(CASE WHEN estado = 'ACTIVO' THEN 1 END)::int AS activos,
                  COUNT(CASE WHEN estado = 'INACTIVO' THEN 1 END)::int AS inactivos
           FROM establecimientos`,
        ),
        query(`SELECT COUNT(*)::int AS total FROM visitas WHERE estado = 'CONFIRMADA'`),
        query(
          `SELECT COUNT(*)::int AS total, COALESCE(SUM(cantidad), 0)::int AS puntos_hoy 
           FROM movimientos_puntos WHERE fecha_movimiento >= CURRENT_DATE AND cantidad > 0`,
        ),
        query(
          `SELECT COUNT(*)::int AS total,
                  COUNT(CASE WHEN estado = 'PENDIENTE' THEN 1 END)::int AS pendientes
           FROM canjes`,
        ),
        query(`SELECT COALESCE(SUM(cantidad), 0)::int AS total FROM movimientos_puntos WHERE cantidad > 0`),
        query(`SELECT COUNT(*)::int AS total FROM tarjetas_nfc`),
        query(
          `SELECT COUNT(*)::int AS total FROM tarjetas_nfc WHERE estado = 'DISPONIBLE'`,
        ),
        query(
          `SELECT COUNT(*)::int AS total FROM reclamaciones WHERE estado = 'PENDIENTE'`,
        ),
      ]);

      const batch2 = await Promise.all([
        query(
          `SELECT COUNT(*)::int AS total FROM reclamaciones WHERE estado = 'RESUELTO'`,
        ),
        query(
          `SELECT v.id_visita AS id, 20 AS puntos_ganados, 'NFC' AS metodo_validacion, v.fecha_hora,
                  u.nombres || ' ' || COALESCE(u.apellidos, '') AS usuario_nombre,
                  u.foto_perfil AS usuario_avatar,
                  e.nombre_comercial AS establecimiento_nombre
           FROM visitas v
           JOIN clientes c ON c.id_cliente = v.id_cliente
           JOIN usuarios u ON u.id_usuario = c.id_usuario
           JOIN sucursales s ON s.id_sucursal = v.id_sucursal
           JOIN establecimientos e ON e.id_establecimiento = s.id_establecimiento
           ORDER BY v.fecha_hora DESC
           LIMIT 8`,
        ),
        query(
          `SELECT 
             TO_CHAR(d.fecha, 'YYYY-MM-DD') AS fecha,
             TO_CHAR(d.fecha, 'Dy') AS dia_nombre,
             COUNT(v.id_visita)::int AS nuevos_clientes
           FROM generate_series(
             DATE_TRUNC('week', CURRENT_DATE)::date,
             (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::date,
             '1 day'::interval
           ) d(fecha)
           LEFT JOIN visitas v ON DATE(v.fecha_hora) = DATE(d.fecha)
           GROUP BY d.fecha
           ORDER BY d.fecha ASC`,
        ),
        query(
          `SELECT r.nombre AS rol, COUNT(u.id_usuario)::int AS total
           FROM roles r
           LEFT JOIN usuarios u ON u.id_rol = r.id_rol
           GROUP BY r.nombre`,
        ),
        query(
          `SELECT 'Explorador' AS nivel, '#C5A059' AS color_hex, COUNT(*)::int AS total
           FROM clientes`,
        ),
        query(
          `SELECT 'NFC' AS metodo, COUNT(*)::int AS total FROM visitas`,
        ),
        query(
          `SELECT 
             e.id_establecimiento AS id, 
             e.nombre_comercial AS nombre, 
             e.logo AS imagen_url,
             COUNT(v.id_visita)::int AS total_sellos,
             (COUNT(v.id_visita) * 20)::int AS total_puntos
           FROM establecimientos e
           LEFT JOIN sucursales s ON s.id_establecimiento = e.id_establecimiento
           LEFT JOIN visitas v ON v.id_sucursal = s.id_sucursal
           GROUP BY e.id_establecimiento, e.nombre_comercial, e.logo
           ORDER BY total_sellos DESC
           LIMIT 5`,
        ),
        query(
          `SELECT 
             COUNT(*)::int AS total,
             COUNT(CASE WHEN estado = 'DISPONIBLE' THEN 1 END)::int AS en_stock,
             COUNT(CASE WHEN estado = 'ACTIVA' THEN 1 END)::int AS asignadas,
             COUNT(CASE WHEN estado = 'PERDIDA' THEN 1 END)::int AS extraviadas,
             COUNT(CASE WHEN estado = 'BLOQUEADA' THEN 1 END)::int AS bloqueadas
           FROM tarjetas_nfc`,
        ),
      ]);

      const [
        usuarios,
        locales,
        visitas,
        visitasHoy,
        canjes,
        publicaciones,
        tarjetas,
        tarjetasStock,
        reclamaciones,
      ] = batch1;

      const [
        denuncias,
        actividadReciente,
        tendencia7Dias,
        distribucionRoles,
        distribucionNiveles,
        distribucionMetodos,
        topEstablecimientos,
        resumenNfc,
      ] = batch2;

      sendResponse(
        res,
        200,
        {
          usuarios: usuarios.rows[0]?.total ?? 0,
          establecimientos_activos: locales.rows[0]?.activos ?? 0,
          establecimientos_totales: locales.rows[0]?.total ?? 0,
          visitas_totales: visitas.rows[0]?.total ?? 0,
          visitas_hoy: visitasHoy.rows[0]?.total ?? 0,
          puntos_hoy: visitasHoy.rows[0]?.puntos_hoy ?? 0,
          canjes_totales: canjes.rows[0]?.total ?? 0,
          canjes_pendientes: canjes.rows[0]?.pendientes ?? 0,
          publicaciones: publicaciones.rows[0]?.total ?? 0,
          tarjetas_nfc: tarjetas.rows[0]?.total ?? 0,
          tarjetas_stock: tarjetasStock.rows[0]?.total ?? 0,
          reclamaciones_pendientes: reclamaciones.rows[0]?.total ?? 0,
          denuncias_pendientes: denuncias.rows[0]?.total ?? 0,
          actividad_reciente: actividadReciente.rows ?? [],
          tendencia_7_dias: tendencia7Dias.rows ?? [],
          distribucion_roles: distribucionRoles.rows ?? [],
          distribucion_niveles: distribucionNiveles.rows ?? [],
          distribucion_metodos: distribucionMetodos.rows ?? [],
          top_establecimientos: topEstablecimientos.rows ?? [],
          resumen_nfc: resumenNfc.rows[0] ?? {
            total: 0,
            en_stock: 0,
            asignadas: 0,
            extraviadas: 0,
            bloqueadas: 0,
          },
        },
        "Dashboard admin analítico",
      );
    } catch (error) {
      console.error("DASHBOARD ERROR:", error);
      next(error);
    }
  },

  /** Listar usuarios */
  async listarUsuarios(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { rol, estado, q } = req.query;
      let sql = `
        SELECT u.id_usuario AS id, u.nombres, u.apellidos, u.email, u.telefono, u.foto_perfil AS avatar_url,
               COALESCE((SELECT COUNT(*) FROM sellos_digitales s JOIN visitas v ON v.id_visita = s.id_visita WHERE v.id_cliente = c.id_cliente), 0)::int AS total_sellos,
               COALESCE((SELECT SUM(cantidad) FROM movimientos_puntos WHERE id_cliente = c.id_cliente), 0)::int AS puntos_globales,
               CASE WHEN u.estado = 1 THEN 'ACTIVO' ELSE 'INACTIVO' END AS estado,
               u.fecha_creacion AS created_at,
               CASE 
                 WHEN r.nombre IN ('ADMIN_GENERAL', 'ADMIN') THEN 'ADMIN'
                 WHEN r.nombre IN ('ADMIN_LOCAL', 'TRABAJADOR_LOCAL', 'COMERCIO') THEN 'COMERCIO'
                 ELSE 'CLIENTE'
               END AS rol_nombre,
               r.nombre AS rol_bd,
               'Explorador' AS nivel_nombre
        FROM usuarios u
        JOIN roles r ON r.id_rol = u.id_rol
        LEFT JOIN clientes c ON c.id_usuario = u.id_usuario
        WHERE 1=1
      `;
      const params: any[] = [];

      if (rol && rol !== "TODOS") {
        const rolUpper = String(rol).toUpperCase().trim();
        if (rolUpper === "COMERCIO") {
          sql += ` AND r.nombre IN ('ADMIN_LOCAL', 'TRABAJADOR_LOCAL', 'COMERCIO')`;
        } else if (rolUpper === "ADMIN") {
          sql += ` AND r.nombre IN ('ADMIN_GENERAL', 'ADMIN')`;
        } else {
          params.push(rolUpper);
          sql += ` AND r.nombre = $${params.length}`;
        }
      }
      if (estado && estado !== "TODOS") {
        const estNum = estado === "ACTIVO" ? 1 : 0;
        params.push(estNum);
        sql += ` AND u.estado = $${params.length}`;
      }
      if (q && String(q).trim()) {
        params.push(`%${String(q).trim()}%`);
        sql += ` AND (u.email ILIKE $${params.length} OR u.nombres ILIKE $${params.length} OR u.apellidos ILIKE $${params.length})`;
      }

      sql += " ORDER BY u.fecha_creacion DESC LIMIT 200";
      const result = await query(sql, params);
      sendResponse(res, 200, result.rows, "Usuarios");
    } catch (error) {
      next(error);
    }
  },

  /** Crear nuevo usuario / cliente desde el panel administrativo */
  async crearUsuario(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { nombres, apellidos, email, password, rol, telefono } = req.body;

      if (!email || !nombres || !apellidos) {
        throw new ApiError(400, "Completa todos los campos obligatorios (nombres, apellidos, correo)");
      }

      const emailClean = email.toLowerCase().trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
        throw new ApiError(400, "El formato del correo electrónico no es válido");
      }

      const existing = await UserModel.findByEmail(emailClean);
      if (existing) {
        throw new ApiError(409, "Ya existe un usuario registrado con ese correo electrónico");
      }

      // Contraseña por defecto si el administrador no ingresó una
      const rawPassword = password?.trim() || "Pass1234!";
      if (rawPassword.length < 6) {
        throw new ApiError(400, "La contraseña debe tener al menos 6 caracteres");
      }

      const passwordHash = await hashPassword(rawPassword);
      const rolSolicitado = (rol || "CLIENTE").toUpperCase().trim();

      const user = await UserModel.createUser(
        emailClean,
        passwordHash,
        nombres.trim(),
        apellidos.trim(),
        rolSolicitado,
        telefono?.trim() || null,
      );

      // Registrar auditoría
      await query(
        `INSERT INTO auditoria (id_usuario, modulo, accion, entidad, id_entidad, descripcion, ip, user_agent)
         VALUES ($1, 'USUARIOS', 'CREAR', 'usuarios', $2, $3, $4, $5)`,
        [
          req.user?.id || user.id_usuario,
          user.id_usuario,
          `Creación de usuario (${rolSolicitado}): ${emailClean}`,
          req.ip || null,
          req.headers["user-agent"] || null,
        ],
      );

      sendResponse(
        res,
        201,
        {
          id: user.id_usuario,
          nombres: user.nombres,
          apellidos: user.apellidos,
          email: user.email,
          telefono: user.telefono || null,
          rol_nombre: rolSolicitado === "ADMIN" ? "ADMIN" : rolSolicitado === "COMERCIO" ? "COMERCIO" : "CLIENTE",
          id_cliente: user.id_cliente,
          codigo_cliente: user.codigo_cliente,
          temporary_password: !password ? rawPassword : null,
        },
        "Usuario registrado correctamente",
      );
    } catch (error) {
      next(error);
    }
  },

  /** Actualizar usuario (nombres, apellidos, email, rol, estado) */
  async actualizarUsuario(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const { nombres, apellidos, email, rol, estado } = req.body;

      let sql = `UPDATE usuarios SET fecha_actualizacion = CURRENT_TIMESTAMP`;
      const params: any[] = [];
      let paramIndex = 1;

      if (nombres !== undefined) {
        params.push(nombres);
        sql += `, nombres = $${paramIndex++}`;
      }
      if (apellidos !== undefined) {
        params.push(apellidos);
        sql += `, apellidos = $${paramIndex++}`;
      }
      if (email !== undefined) {
        params.push(email.toLowerCase().trim());
        sql += `, email = $${paramIndex++}`;
      }
      if (estado !== undefined) {
        const estNum = estado === "ACTIVO" ? 1 : 0;
        params.push(estNum);
        sql += `, estado = $${paramIndex++}`;
      }
      if (rol !== undefined) {
        const roleRes = await query(
          `SELECT id_rol FROM roles WHERE nombre = $1 OR nombre = $2`,
          [rol, rol === "COMERCIO" ? "ADMIN_LOCAL" : rol === "ADMIN" ? "ADMIN_GENERAL" : rol]
        );
        if (!roleRes.rows[0]) throw new ApiError(400, "Rol no existe");
        params.push(roleRes.rows[0].id_rol);
        sql += `, id_rol = $${paramIndex++}`;
      }

      sql += ` WHERE id_usuario = $${paramIndex} RETURNING id_usuario AS id, email, nombres, apellidos, estado`;
      params.push(id);

      const result = await query(sql, params);
      if (!result.rows[0]) throw new ApiError(404, "Usuario no encontrado");

      sendResponse(res, 200, result.rows[0], "Usuario actualizado");
    } catch (error) {
      next(error);
    }
  },

  /** Eliminar usuario */
  async eliminarUsuario(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;

      // Prevent deleting the main admin
      const checkRes = await query(
        `SELECT u.email, r.nombre as rol_nombre 
         FROM usuarios u 
         JOIN roles r ON u.id_rol = r.id_rol 
         WHERE u.id_usuario = $1`,
        [id]
      );
      if (!checkRes.rows[0]) throw new ApiError(404, "Usuario no encontrado");
      if (checkRes.rows[0].rol_nombre === "ADMIN" || checkRes.rows[0].rol_nombre === "ADMIN_GENERAL") {
        throw new ApiError(403, "No se puede eliminar a un administrador general");
      }

      // Desvincular de usuario_sucursal si tiene asignaciones antes de eliminar
      await query(`DELETE FROM usuario_sucursal WHERE id_usuario = $1`, [id]);

      // Eliminar registros dependientes si es cliente (sellos, tarjetas, clientes)
      const cliRes = await query(`SELECT id_cliente FROM clientes WHERE id_usuario = $1`, [id]);
      if (cliRes.rows[0]) {
        const idCliente = cliRes.rows[0].id_cliente;
        await query(`UPDATE tarjetas_nfc SET id_cliente = NULL, estado = 'DISPONIBLE' WHERE id_cliente = $1`, [idCliente]);
        await query(`DELETE FROM canjes WHERE id_cliente = $1`, [idCliente]);
        await query(`DELETE FROM movimientos_puntos WHERE id_cliente = $1`, [idCliente]);
        await query(`DELETE FROM sellos_digitales WHERE id_visita IN (SELECT id_visita FROM visitas WHERE id_cliente = $1)`, [idCliente]);
        await query(`DELETE FROM visitas WHERE id_cliente = $1`, [idCliente]);
        await query(`DELETE FROM clientes WHERE id_cliente = $1`, [idCliente]);
      }

      await query(`DELETE FROM auditoria WHERE id_usuario = $1`, [id]);
      await query(`DELETE FROM notificaciones WHERE id_usuario = $1`, [id]);
      await query(`DELETE FROM usuarios WHERE id_usuario = $1`, [id]);

      sendResponse(res, 200, null, "Usuario eliminado permanentemente");
    } catch (error) {
      next(error);
    }
  },

  /** Inventario de tarjetas NFC */
  async listarTarjetas(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { estado } = req.query;
      let sql = `
        SELECT t.id_tarjeta AS id, t.uid_nfc, t.codigo_interno, t.estado, t.fecha_creacion AS created_at,
               u.nombres, u.apellidos, u.email
        FROM tarjetas_nfc t
        LEFT JOIN clientes c ON c.id_cliente = t.id_cliente
        LEFT JOIN usuarios u ON u.id_usuario = c.id_usuario
        WHERE 1=1
      `;
      const params: any[] = [];
      if (estado && estado !== "TODOS") {
        params.push(estado);
        sql += ` AND t.estado = $${params.length}`;
      }
      sql += " ORDER BY t.fecha_creacion DESC LIMIT 500";
      const result = await query(sql, params);
      sendResponse(res, 200, result.rows, "Tarjetas NFC");
    } catch (error) {
      next(error);
    }
  },

  /** Registrar tarjetas en stock (lote) */
  async registrarTarjetasStock(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { uids } = req.body; // string[]
      if (!Array.isArray(uids) || uids.length === 0) {
        throw new ApiError(400, "Envía un array uids con los UID NFC");
      }

      const insertadas: any[] = [];
      for (const uid of uids) {
        const cleanUid = String(uid).trim().toUpperCase();
        if (!cleanUid) continue;
        const codigoInterno = `NFC-${cleanUid.replace(/[^A-Z0-9]/g, "").slice(0, 10)}`;
        try {
          const r = await query(
            `INSERT INTO tarjetas_nfc (uid_nfc, codigo_interno, estado)
             VALUES ($1, $2, 'DISPONIBLE')
             ON CONFLICT (uid_nfc) DO NOTHING
             RETURNING id_tarjeta AS id, uid_nfc, codigo_interno, estado, fecha_creacion AS created_at`,
            [cleanUid, codigoInterno],
          );
          if (r.rows[0]) insertadas.push(r.rows[0]);
        } catch {
          // continuar con el resto
        }
      }

      sendResponse(
        res,
        201,
        { insertadas: insertadas.length, tarjetas: insertadas },
        "Tarjetas registradas en stock exitosamente",
      );
    } catch (error) {
      next(error);
    }
  },

  /** Cambiar estado de una tarjeta NFC (con historial y motivos) */
  async cambiarEstadoTarjeta(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const { estado, motivo } = req.body;

      const ESTADOS_VALIDOS = [
        "DISPONIBLE",
        "ACTIVA",
        "BLOQUEADA",
        "PERDIDA",
        "DANADA",
        "REEMPLAZADA",
      ];
      if (!ESTADOS_VALIDOS.includes(estado)) {
        throw new ApiError(
          400,
          `Estado de tarjeta inválido. Permitidos: ${ESTADOS_VALIDOS.join(", ")}`,
        );
      }

      const actual = await query(
        `SELECT id_tarjeta, estado FROM tarjetas_nfc WHERE id_tarjeta = $1`,
        [id],
      );
      if (!actual.rows[0]) throw new ApiError(404, "Tarjeta no encontrada");

      const estadoAnterior = actual.rows[0].estado;

      const result = await query(
        `UPDATE tarjetas_nfc 
         SET estado = $2,
             fecha_bloqueo = CASE WHEN $2 IN ('BLOQUEADA', 'PERDIDA') THEN CURRENT_TIMESTAMP ELSE fecha_bloqueo END,
             motivo_bloqueo = CASE WHEN $2 IN ('BLOQUEADA', 'PERDIDA') THEN COALESCE($3, motivo_bloqueo) ELSE motivo_bloqueo END,
             fecha_actualizacion = CURRENT_TIMESTAMP
         WHERE id_tarjeta = $1 
         RETURNING id_tarjeta AS id, uid_nfc, codigo_interno, estado, fecha_bloqueo, motivo_bloqueo`,
        [id, estado, motivo || null],
      );

      // Registrar trazabilidad inmutable en historial_tarjeta_nfc
      try {
        await query(
          `INSERT INTO historial_tarjeta_nfc (id_tarjeta, id_usuario_accion, accion, estado_anterior, estado_nuevo, motivo, fecha_hora)
           VALUES ($1, $2, 'CAMBIO_ESTADO', $3, $4, $5, CURRENT_TIMESTAMP)`,
          [id, req.user?.id || null, estadoAnterior, estado, motivo || "Actualizado desde panel administrativo"],
        );
      } catch {
        // No bloquear la respuesta si el log falla
      }

      sendResponse(res, 200, result.rows[0], "Estado de tarjeta actualizado");
    } catch (error) {
      next(error);
    }
  },

  /** Moderación: listar publicaciones en revisión o denuncias */
  async moderacionPendiente(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const pubs = await query(
        `SELECT p.*, u.nombres AS autor_nombres, u.apellidos AS autor_apellidos, u.email AS autor_email
         FROM publicaciones p
         JOIN usuarios u ON u.id = p.usuario_id
         WHERE p.estado_moderacion IN ('REVISION', 'OCULTA')
         ORDER BY p.created_at DESC
         LIMIT 100`,
      );

      const denuncias = await query(
        `SELECT d.*, p.texto_contenido, u.nombres AS reportador_nombres, u.email AS reportador_email
         FROM denuncias_moderacion d
         JOIN publicaciones p ON p.id = d.publicacion_id
         JOIN usuarios u ON u.id = d.usuario_reportador_id
         WHERE d.estado_revision = 'PENDIENTE'
         ORDER BY d.fecha_reporte DESC
         LIMIT 100`,
      );

      sendResponse(
        res,
        200,
        { publicaciones: pubs.rows, denuncias: denuncias.rows },
        "Cola de moderación",
      );
    } catch (error) {
      next(error);
    }
  },

  /** Resolver moderación de una publicación */
  async moderarPublicacion(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) throw new ApiError(401, "No autenticado");
      const { id } = req.params;
      const { estado_moderacion } = req.body; // APROBADA | OCULTA | ELIMINADA | REVISION

      if (
        !["APROBADA", "REVISION", "OCULTA", "ELIMINADA"].includes(
          estado_moderacion,
        )
      ) {
        throw new ApiError(400, "estado_moderacion inválido");
      }

      const result = await query(
        `UPDATE publicaciones SET estado_moderacion = $2 WHERE id = $1 RETURNING *`,
        [id, estado_moderacion],
      );
      if (!result.rows[0]) throw new ApiError(404, "Publicación no encontrada");
      sendResponse(res, 200, result.rows[0], "Publicación moderada");
    } catch (error) {
      next(error);
    }
  },

  /** Resolver denuncia */
  async resolverDenuncia(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) throw new ApiError(401, "No autenticado");
      const { id } = req.params;
      const { estado_revision } = req.body; // REVISADO | DESCARTADO

      if (!["REVISADO", "DESCARTADO"].includes(estado_revision)) {
        throw new ApiError(400, "estado_revision inválido");
      }

      const result = await query(
        `UPDATE denuncias_moderacion SET
           estado_revision = $2,
           admin_revisor_id = $3,
           fecha_revision = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [id, estado_revision, req.user.id],
      );
      if (!result.rows[0]) throw new ApiError(404, "Denuncia no encontrada");
      sendResponse(res, 200, result.rows[0], "Denuncia resuelta");
    } catch (error) {
      next(error);
    }
  },

  /** Crear recompensa (admin) */
  async crearRecompensa(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const {
        nombre_recompensa,
        descripcion,
        costo_puntos_globales,
        stock_disponible,
        imagen_url,
        id_establecimiento,
        fecha_inicio,
        fecha_fin,
      } = req.body;

      if (!nombre_recompensa || costo_puntos_globales == null) {
        throw new ApiError(
          400,
          "nombre_recompensa y costo_puntos_globales son obligatorios",
        );
      }

      // El id_establecimiento es opcional: si no se provee, la recompensa es Global / Oficina Central
      const estabId = id_establecimiento ? Number(id_establecimiento) : null;

      const result = await query(
        `INSERT INTO recompensas
           (id_establecimiento, nombre, descripcion, puntos_requeridos, stock,
            imagen, stock_ilimitado, fecha_inicio, fecha_fin, estado, fecha_creacion, fecha_actualizacion)
         VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, CURRENT_TIMESTAMP), $9, 'ACTIVA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id_recompensa AS id, nombre AS nombre_recompensa, descripcion, puntos_requeridos AS costo_puntos_globales, stock AS stock_disponible, imagen AS imagen_url, estado, fecha_creacion AS created_at`,
        [
          estabId,
          nombre_recompensa,
          descripcion || null,
          Number(costo_puntos_globales),
          stock_disponible != null ? Number(stock_disponible) : null,
          imagen_url || null,
          stock_disponible == null ? 1 : 0,
          fecha_inicio || null,
          fecha_fin || null,
        ],
      );

      sendResponse(res, 201, result.rows[0], "Recompensa creada exitosamente");
    } catch (error) {
      next(error);
    }
  },

  /** Listar todas las recompensas para administración */
  async listarRecompensas(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await query(
        `SELECT r.id_recompensa AS id, r.nombre AS nombre_recompensa, r.descripcion,
                r.puntos_requeridos AS costo_puntos_globales, r.stock AS stock_disponible,
                r.imagen AS imagen_url, 'DIGITAL' AS tipo_entrega, r.estado, r.fecha_creacion AS created_at,
                COALESCE(e.nombre_comercial, 'General') AS establecimiento_nombre
         FROM recompensas r
         LEFT JOIN establecimientos e ON e.id_establecimiento = r.id_establecimiento
         ORDER BY r.fecha_creacion DESC`,
      );
      sendResponse(res, 200, result.rows, "Catálogo completo de recompensas");
    } catch (error) {
      next(error);
    }
  },

  /** Actualizar recompensa (admin) */
  async actualizarRecompensa(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const {
        nombre_recompensa,
        descripcion,
        costo_puntos_globales,
        stock_disponible,
        imagen_url,
        fecha_inicio,
        fecha_fin,
        estado,
        id_establecimiento,
      } = req.body;

      const current = await query(
        `SELECT * FROM recompensas WHERE id_recompensa = $1`,
        [id],
      );
      if (!current.rows.length) {
        throw new ApiError(404, "Recompensa no encontrada");
      }

      const result = await query(
        `UPDATE recompensas
         SET nombre = COALESCE($1, nombre),
             descripcion = COALESCE($2, descripcion),
             puntos_requeridos = COALESCE($3, puntos_requeridos),
             stock = COALESCE($4, stock),
             imagen = COALESCE($5, imagen),
             fecha_inicio = COALESCE($6, fecha_inicio),
             fecha_fin = COALESCE($7, fecha_fin),
             estado = COALESCE($8, estado),
             id_establecimiento = CASE WHEN $9::text = 'REMOVE' THEN NULL WHEN $9 IS NOT NULL THEN $9::bigint ELSE id_establecimiento END,
             fecha_actualizacion = CURRENT_TIMESTAMP
         WHERE id_recompensa = $10
         RETURNING id_recompensa AS id, nombre AS nombre_recompensa, descripcion, puntos_requeridos AS costo_puntos_globales, stock AS stock_disponible, imagen AS imagen_url, estado, id_establecimiento`,
        [
          nombre_recompensa ?? null,
          descripcion !== undefined ? descripcion : null,
          costo_puntos_globales != null ? Number(costo_puntos_globales) : null,
          stock_disponible !== undefined ? (stock_disponible != null ? Number(stock_disponible) : null) : null,
          imagen_url !== undefined ? imagen_url : null,
          fecha_inicio !== undefined ? fecha_inicio : null,
          fecha_fin !== undefined ? fecha_fin : null,
          estado ?? null,
          id_establecimiento !== undefined ? (id_establecimiento ? String(id_establecimiento) : "REMOVE") : null,
          id,
        ],
      );

      sendResponse(res, 200, result.rows[0], "Recompensa actualizada");
    } catch (error) {
      next(error);
    }
  },

  /** Niveles de pasaporte */
  async listarNiveles(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await query(
        `SELECT * FROM niveles_pasaporte WHERE estado = TRUE ORDER BY sellos_requeridos ASC`,
      );
      sendResponse(res, 200, result.rows, "Niveles");
    } catch (error) {
      next(error);
    }
  },

  /** Roles del sistema */
  async listarRoles(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await query(`SELECT * FROM roles ORDER BY nombre`);
      sendResponse(res, 200, result.rows, "Roles");
    } catch (error) {
      next(error);
    }
  },

  // --- Reglas de sellos (puntos por sello, límites, temporada) ---
  async listarReglasSellos(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      // Auto-asegurar reglas por defecto para establecimientos que no tengan
      await query(`
        INSERT INTO reglas_sellos (
          establecimiento_id, nombre_accion, valor_puntos_por_sello, limite_diario_por_usuario, estado
        )
        SELECT 
          e.id_establecimiento,
          'Visita con Sello NFC',
          COALESCE(ps.puntos_por_visita, 20),
          1,
          'ACTIVA'
        FROM establecimientos e
        LEFT JOIN programas_sellos ps ON ps.id_establecimiento = e.id_establecimiento
        WHERE NOT EXISTS (
          SELECT 1 FROM reglas_sellos r WHERE r.establecimiento_id = e.id_establecimiento
        )
      `);

      const result = await query(`
        SELECT r.*, e.nombre_comercial AS establecimiento_nombre, e.razon_social
        FROM reglas_sellos r
        LEFT JOIN establecimientos e ON e.id_establecimiento = r.establecimiento_id
        ORDER BY r.created_at DESC
      `);
      sendResponse(res, 200, result.rows, "Reglas de sellos");
    } catch (error) {
      next(error);
    }
  },

  async crearReglaSello(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const {
        establecimiento_id,
        nombre_accion = "Visita estándar",
        valor_puntos_por_sello = 10,
        limite_diario_por_usuario = 1,
        estado = "ACTIVA",
        fecha_inicio = null,
        fecha_fin = null,
      } = req.body;

      let estId = establecimiento_id;
      if (!estId) {
        const estRes = await query(`SELECT id_establecimiento FROM establecimientos LIMIT 1`);
        estId = estRes.rows[0]?.id_establecimiento;
      }

      if (!estId) {
        throw new ApiError(
          400,
          "Debes tener al menos un establecimiento para registrar la regla",
        );
      }

      const result = await query(
        `INSERT INTO reglas_sellos (
           establecimiento_id, nombre_accion, valor_puntos_por_sello,
           limite_diario_por_usuario, estado, fecha_inicio, fecha_fin
         ) VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING *`,
        [
          estId,
          nombre_accion,
          Number(valor_puntos_por_sello),
          Number(limite_diario_por_usuario),
          estado,
          fecha_inicio || null,
          fecha_fin || null,
        ],
      );

      sendResponse(res, 201, result.rows[0], "Regla creada");
    } catch (error) {
      next(error);
    }
  },

  async actualizarReglaSello(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const {
        nombre_accion,
        valor_puntos_por_sello,
        limite_diario_por_usuario,
        estado,
        fecha_inicio,
        fecha_fin,
      } = req.body;

      const result = await query(
        `UPDATE reglas_sellos SET
           nombre_accion = COALESCE($2, nombre_accion),
           valor_puntos_por_sello = COALESCE($3, valor_puntos_por_sello),
           limite_diario_por_usuario = COALESCE($4, limite_diario_por_usuario),
           estado = COALESCE($5, estado),
           fecha_inicio = COALESCE($6, fecha_inicio),
           fecha_fin = COALESCE($7, fecha_fin)
         WHERE id = $1
         RETURNING *`,
        [
          id,
          nombre_accion ?? null,
          valor_puntos_por_sello != null
            ? Number(valor_puntos_por_sello)
            : null,
          limite_diario_por_usuario != null
            ? Number(limite_diario_por_usuario)
            : null,
          estado ?? null,
          fecha_inicio ?? null,
          fecha_fin ?? null,
        ],
      );

      if (!result.rows[0]) throw new ApiError(404, "Regla no encontrada");

      if (valor_puntos_por_sello != null && Number(valor_puntos_por_sello) > 0) {
        await query(
          `UPDATE programas_sellos 
           SET puntos_por_visita = $1, fecha_actualizacion = CURRENT_TIMESTAMP 
           WHERE id_establecimiento = $2`,
          [Number(valor_puntos_por_sello), result.rows[0].establecimiento_id],
        );
      }

      sendResponse(res, 200, result.rows[0], "Regla actualizada");
    } catch (error) {
      next(error);
    }
  },

  async eliminarReglaSello(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const result = await query(
        `DELETE FROM reglas_sellos WHERE id = $1 RETURNING id`,
        [id],
      );
      if (!result.rows[0]) throw new ApiError(404, "Regla no encontrada");
      sendResponse(res, 200, null, "Regla eliminada");
    } catch (error) {
      next(error);
    }
  },

  // ===== CATEGORÍAS DE ESTABLECIMIENTOS =====
  async listarCategorias(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await query(
        `SELECT 
           c.id,
           c.nombre,
           c.icono_url,
           c.estado,
           c.fecha_creacion,
           COUNT(e.id_establecimiento)::int AS total_locales
         FROM categorias_establecimiento c
         LEFT JOIN establecimientos e ON e.categoria_id = c.id
         GROUP BY c.id, c.nombre, c.icono_url, c.estado, c.fecha_creacion
         ORDER BY c.nombre ASC`,
      );
      sendResponse(res, 200, result.rows, "Categorías obtenidas");
    } catch (error) {
      next(error);
    }
  },

  async crearCategoria(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { nombre, icono_url, estado } = req.body;
      if (!nombre?.trim()) {
        throw new ApiError(400, "El nombre de la categoría es obligatorio");
      }

      const existe = await query(
        `SELECT id FROM categorias_establecimiento WHERE LOWER(nombre) = LOWER($1)`,
        [nombre.trim()],
      );
      if (existe.rows.length > 0) {
        throw new ApiError(400, "Ya existe una categoría con ese nombre");
      }

      const result = await query(
        `INSERT INTO categorias_establecimiento (nombre, icono_url, estado)
         VALUES ($1, $2, COALESCE($3, true))
         RETURNING *`,
        [nombre.trim(), icono_url || "☕", estado !== undefined ? Boolean(estado) : true],
      );

      sendResponse(res, 201, result.rows[0], "Categoría creada correctamente");
    } catch (error) {
      next(error);
    }
  },

  async actualizarCategoria(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const { nombre, icono_url, estado } = req.body;

      if (nombre?.trim()) {
        const existe = await query(
          `SELECT id FROM categorias_establecimiento WHERE LOWER(nombre) = LOWER($1) AND id != $2`,
          [nombre.trim(), id],
        );
        if (existe.rows.length > 0) {
          throw new ApiError(400, "Ya existe otra categoría con ese nombre");
        }
      }

      const result = await query(
        `UPDATE categorias_establecimiento
         SET 
           nombre = COALESCE($2, nombre),
           icono_url = COALESCE($3, icono_url),
           estado = COALESCE($4, estado)
         WHERE id = $1
         RETURNING *`,
        [
          id,
          nombre?.trim() ?? null,
          icono_url !== undefined ? icono_url : null,
          estado !== undefined ? Boolean(estado) : null,
        ],
      );

      if (!result.rows[0]) throw new ApiError(404, "Categoría no encontrada");
      sendResponse(res, 200, result.rows[0], "Categoría actualizada");
    } catch (error) {
      next(error);
    }
  },

  async eliminarCategoria(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;

      const locales = await query(
        `SELECT COUNT(*)::int AS count FROM establecimientos WHERE categoria_id = $1`,
        [id],
      );
      if (locales.rows[0]?.count > 0) {
        throw new ApiError(
          400,
          `No se puede eliminar la categoría porque tiene ${locales.rows[0].count} locales asignados. Puedes desactivarla en su lugar.`,
        );
      }

      const result = await query(
        `DELETE FROM categorias_establecimiento WHERE id = $1 RETURNING id`,
        [id],
      );

      if (!result.rows[0]) throw new ApiError(404, "Categoría no encontrada");
      sendResponse(res, 200, null, "Categoría eliminada con éxito");
    } catch (error) {
      next(error);
    }
  },

  // ===== GESTIÓN DE CANJES DE RECOMPENSAS =====
  async listarCanjes(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { estado, q } = req.query;
      let sql = `
        SELECT 
          c.id_canje AS id,
          c.puntos_canje AS puntos_gastados,
          c.estado AS estado_entrega,
          c.fecha_solicitud AS fecha_canje,
          c.fecha_validacion AS fecha_entrega,
          c.codigo_canje,
          u.id_usuario AS usuario_id,
          u.nombres || ' ' || COALESCE(u.apellidos, '') AS usuario_nombre,
          u.email AS usuario_email,
          u.foto_perfil AS usuario_avatar,
          r.id_recompensa AS recompensa_id,
          r.nombre AS nombre_recompensa,
          r.imagen AS recompensa_imagen,
          COALESCE(e.nombre_comercial, 'General') AS establecimiento_nombre
        FROM canjes c
        JOIN clientes cl ON cl.id_cliente = c.id_cliente
        JOIN usuarios u ON u.id_usuario = cl.id_usuario
        JOIN recompensas r ON r.id_recompensa = c.id_recompensa
        LEFT JOIN establecimientos e ON e.id_establecimiento = r.id_establecimiento
        WHERE 1=1
      `;
      const params: any[] = [];

      if (estado && estado !== "TODOS") {
        params.push(estado);
        sql += ` AND c.estado = $${params.length}`;
      }
      if (q && String(q).trim()) {
        params.push(`%${String(q).trim()}%`);
        sql += ` AND (
          u.nombres ILIKE $${params.length} OR 
          u.apellidos ILIKE $${params.length} OR 
          u.email ILIKE $${params.length} OR 
          r.nombre ILIKE $${params.length}
        )`;
      }

      sql += ` ORDER BY c.fecha_solicitud DESC LIMIT 200`;
      const result = await query(sql, params);
      sendResponse(res, 200, result.rows, "Canjes obtenidos");
    } catch (error) {
      next(error);
    }
  },

  async actualizarEstadoCanje(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const { estado_entrega } = req.body;

      if (!["PENDIENTE", "CONFIRMADO", "ENTREGADO", "CANCELADO", "CANJEADO"].includes(estado_entrega)) {
        throw new ApiError(400, "Estado de entrega inválido");
      }

      const canjeActual = await query(
        `SELECT * FROM canjes WHERE id_canje = $1`,
        [id],
      );
      if (!canjeActual.rows[0]) throw new ApiError(404, "Canje no encontrado");

      // Si se cancela, devolvemos puntos al cliente
      if (estado_entrega === "CANCELADO" && canjeActual.rows[0].estado !== "CANCELADO") {
        await query(
          `INSERT INTO movimientos_puntos (id_cliente, tipo_movimiento, cantidad, saldo_anterior, saldo_posterior, descripcion, fecha_movimiento)
           VALUES (
             $1, 
             'REVERSO', 
             $2, 
             (SELECT COALESCE(SUM(cantidad), 0) FROM movimientos_puntos WHERE id_cliente = $1),
             (SELECT COALESCE(SUM(cantidad), 0) FROM movimientos_puntos WHERE id_cliente = $1) + $2,
             'Devolución de canje cancelado', 
             CURRENT_TIMESTAMP
           )`,
          [canjeActual.rows[0].id_cliente, canjeActual.rows[0].puntos_canje],
        );
        await query(
          `UPDATE recompensas SET stock = stock + 1 WHERE id_recompensa = $1 AND stock IS NOT NULL`,
          [canjeActual.rows[0].id_recompensa],
        );
      }

      const dbEstado = estado_entrega === "ENTREGADO" ? "CANJEADO" : estado_entrega;

      const result = await query(
        `UPDATE canjes 
         SET estado = $2,
             fecha_validacion = CASE WHEN $2 IN ('CONFIRMADO', 'ENTREGADO', 'CANJEADO') THEN CURRENT_TIMESTAMP ELSE fecha_validacion END
         WHERE id_canje = $1
         RETURNING *`,
        [id, dbEstado],
      );

      sendResponse(res, 200, result.rows[0], "Estado de canje actualizado");
    } catch (error) {
      next(error);
    }
  },

  async resumenNotificaciones(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const [canjesPend, reclamosPend] = await Promise.all([
        query(`
          SELECT 
            c.id_canje AS id, c.fecha_solicitud AS fecha_canje, c.puntos_canje AS puntos_gastados,
            u.nombres || ' ' || COALESCE(u.apellidos, '') AS usuario_nombre,
            u.foto_perfil AS avatar_url,
            r.nombre AS nombre_recompensa
          FROM canjes c
          JOIN clientes cl ON cl.id_cliente = c.id_cliente
          JOIN usuarios u ON u.id_usuario = cl.id_usuario
          JOIN recompensas r ON r.id_recompensa = c.id_recompensa
          WHERE c.estado = 'PENDIENTE'
          ORDER BY c.fecha_solicitud DESC
          LIMIT 5
        `),
        query(`
          SELECT 
            id_reclamacion AS id, codigo_reclamacion AS codigo_seguimiento, tipo AS tipo_registro,
            detalle, fecha_registro AS created_at
          FROM reclamaciones
          WHERE estado = 'PENDIENTE' OR estado = 'REGISTRADO'
          ORDER BY fecha_registro DESC
          LIMIT 5
        `),
      ]);

      const countCanjes = await query(
        `SELECT COUNT(*)::int AS count FROM canjes WHERE estado = 'PENDIENTE'`,
      );
      const countReclamos = await query(
        `SELECT COUNT(*)::int AS count FROM reclamaciones WHERE estado = 'PENDIENTE' OR estado = 'REGISTRADO'`,
      );

      sendResponse(
        res,
        200,
        {
          total_pendientes: (countCanjes.rows[0]?.count ?? 0) + (countReclamos.rows[0]?.count ?? 0),
          canjes_pendientes_count: countCanjes.rows[0]?.count ?? 0,
          canjes_pendientes: canjesPend.rows,
          reclamaciones_pendientes_count: countReclamos.rows[0]?.count ?? 0,
          reclamaciones_pendientes: reclamosPend.rows,
        },
        "Notificaciones",
      );
    } catch (error) {
      next(error);
    }
  },

  /** Log completo de Auditoría */
  async listarAuditoria(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { modulo, q } = req.query;
      let sql = `
        SELECT a.id_auditoria AS id, a.modulo, a.accion, a.entidad, a.id_entidad, a.descripcion,
               a.ip, a.user_agent, a.fecha_hora AS fecha_creacion, a.fecha_hora,
               a.datos_anteriores, a.datos_nuevos,
               u.nombres || ' ' || COALESCE(u.apellidos, '') AS usuario_nombre,
               u.email AS usuario_email,
               r.nombre AS usuario_rol
        FROM auditoria a
        LEFT JOIN usuarios u ON u.id_usuario = a.id_usuario
        LEFT JOIN roles r ON r.id_rol = u.id_rol
        WHERE 1=1
      `;
      const params: any[] = [];
      if (modulo && modulo !== "TODOS") {
        params.push(modulo);
        sql += ` AND a.modulo = $${params.length}`;
      }
      if (q && String(q).trim()) {
        params.push(`%${String(q).trim()}%`);
        sql += ` AND (a.descripcion ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.nombres ILIKE $${params.length})`;
      }

      sql += ` ORDER BY a.fecha_hora DESC LIMIT 200`;
      const result = await query(sql, params);
      sendResponse(res, 200, result.rows, "Auditoría obtenida");
    } catch (error) {
      next(error);
    }
  },

  /** Documentos Legales */
  async listarDocumentosLegales(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await query(
        `SELECT id_documento AS id, id_documento, tipo_documento, titulo, version, contenido_url, 
                fecha_publicacion AS fecha_creacion, fecha_publicacion, fecha_vigencia, estado 
         FROM documentos_legales 
         ORDER BY fecha_publicacion DESC`
      );
      sendResponse(res, 200, result.rows, "Documentos legales");
    } catch (error) {
      next(error);
    }
  },

  /** Visitas Globales */
  async listarVisitas(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { estado, q } = req.query;
      let sql = `
        SELECT v.id_visita AS id, v.fecha_hora, 20 AS puntos_ganados, 'NFC' AS metodo_validacion, v.estado, v.observacion,
               u.nombres || ' ' || COALESCE(u.apellidos, '') AS cliente_nombre,
               u.email AS cliente_email,
               e.nombre_comercial AS establecimiento_nombre,
               s.nombre AS sucursal_nombre,
               val.nombres AS validador_nombre
        FROM visitas v
        JOIN clientes c ON c.id_cliente = v.id_cliente
        JOIN usuarios u ON u.id_usuario = c.id_usuario
        JOIN sucursales s ON s.id_sucursal = v.id_sucursal
        JOIN establecimientos e ON e.id_establecimiento = s.id_establecimiento
        LEFT JOIN usuarios val ON val.id_usuario = v.id_usuario_validador
        WHERE 1=1
      `;
      const params: any[] = [];
      if (estado && estado !== "TODOS") {
        params.push(estado);
        sql += ` AND v.estado = $${params.length}`;
      }
      if (q && String(q).trim()) {
        params.push(`%${String(q).trim()}%`);
        sql += ` AND (u.nombres ILIKE $${params.length} OR u.email ILIKE $${params.length} OR e.nombre_comercial ILIKE $${params.length})`;
      }

      sql += ` ORDER BY v.fecha_hora DESC LIMIT 200`;
      const result = await query(sql, params);
      sendResponse(res, 200, result.rows, "Visitas globales obtenidas");
    } catch (error) {
      next(error);
    }
  },

  // ===== GESTIÓN COMPLETA DE LOCALES / ESTABLECIMIENTOS (ADMIN) =====
  async listarLocales(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { estado, categoria_id, q } = req.query;

      let sql = `
        SELECT 
          e.id_establecimiento AS id,
          e.id_establecimiento,
          e.nombre_comercial,
          e.razon_social,
          e.ruc,
          e.descripcion,
          e.logo,
          e.imagen_portada AS imagen_url,
          COALESCE(e.imagen_portada, e.logo) AS imagen_url,
          e.telefono,
          e.email,
          e.estado,
          e.categoria_id,
          e.fecha_afiliacion,
          cat.nombre AS categoria_nombre,
          cat.icono_url AS categoria_icono,
          -- Sucursal principal datos
          sp.id_sucursal,
          sp.direccion,
          sp.referencia,
          sp.latitud AS lat,
          sp.longitud AS lng,
          -- Usuario encargado (COMERCIO) asignado
          u.id_usuario AS usuario_encargado_id,
          u.email AS usuario_encargado_email,
          u.nombres || ' ' || COALESCE(u.apellidos, '') AS usuario_encargado_nombre,
          -- Cantidad de sucursales activas
          (SELECT COUNT(*)::int FROM sucursales s WHERE s.id_establecimiento = e.id_establecimiento AND s.estado = 1) AS total_sucursales,
          -- Sello y Reglas de Puntos por visita
          ps.id_programa,
          COALESCE(ps.nombre_sello, 'Sello ' || e.nombre_comercial) AS nombre_sello,
          COALESCE(ps.imagen_sello, cat.icono_url, '🏛️') AS imagen_sello,
          COALESCE(ps.color_sello, '#7C0A1E') AS color_sello,
          COALESCE(ps.puntos_por_visita, 20) AS puntos_por_visita,
          COALESCE(ps.meta_sellos, 8) AS meta_sellos
        FROM establecimientos e
        LEFT JOIN categorias_establecimiento cat ON cat.id = e.categoria_id
        LEFT JOIN sucursales sp ON sp.id_establecimiento = e.id_establecimiento AND sp.es_principal = 1
        LEFT JOIN usuario_sucursal us ON us.id_sucursal = sp.id_sucursal AND us.estado = 1
        LEFT JOIN usuarios u ON u.id_usuario = us.id_usuario
        LEFT JOIN LATERAL (
          SELECT id_programa, nombre_sello, imagen_sello, color_sello, puntos_por_visita, meta_sellos
          FROM programas_sellos
          WHERE id_establecimiento = e.id_establecimiento
          ORDER BY id_programa DESC
          LIMIT 1
        ) ps ON true
        WHERE 1=1
      `;
      const params: any[] = [];

      if (estado && estado !== "TODOS") {
        params.push(estado);
        sql += ` AND e.estado = $${params.length}`;
      }

      if (categoria_id && categoria_id !== "TODAS") {
        params.push(Number(categoria_id));
        sql += ` AND e.categoria_id = $${params.length}`;
      }

      if (q && String(q).trim()) {
        params.push(`%${String(q).trim()}%`);
        sql += ` AND (e.nombre_comercial ILIKE $${params.length} OR e.razon_social ILIKE $${params.length} OR e.ruc ILIKE $${params.length} OR sp.direccion ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
      }

      sql += ` ORDER BY e.id_establecimiento DESC`;

      const result = await query(sql, params);
      sendResponse(res, 200, result.rows, "Locales obtenidos para administración");
    } catch (error) {
      next(error);
    }
  },

  async crearLocal(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const {
        razon_social,
        ruc,
        direccion,
        lat,
        lng,
        categoria_id,
        telefono,
        email,
        descripcion,
        horario,
        imagen_url,
        usuario_id, // opcional: ID de usuario comercio a asignar directamente
      } = req.body;

      if (!razon_social?.trim()) {
        throw new ApiError(400, "La razón social o nombre comercial es obligatorio");
      }
      if (!ruc?.trim() || !/^\d{11}$/.test(ruc.trim())) {
        throw new ApiError(400, "El RUC debe tener 11 dígitos");
      }
      if (!direccion?.trim()) {
        throw new ApiError(400, "La dirección principal es obligatoria");
      }

      // Validar RUC único
      const rucCheck = await query(
        `SELECT id_establecimiento FROM establecimientos WHERE ruc = $1`,
        [ruc.trim()],
      );
      if (rucCheck.rows.length > 0) {
        throw new ApiError(409, "Ya existe un establecimiento registrado con ese RUC");
      }

      // 1. Crear establecimiento
      const estRes = await query(
        `INSERT INTO establecimientos (
           nombre_comercial, razon_social, ruc, descripcion,
           logo, imagen_portada, email, telefono, categoria_id, estado, fecha_afiliacion
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ACTIVO', CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          razon_social.trim(),
          razon_social.trim(),
          ruc.trim(),
          descripcion?.trim() || null,
          imagen_url || null,
          imagen_url || null,
          email?.trim() || null,
          telefono?.trim() || null,
          categoria_id ? Number(categoria_id) : null,
        ],
      );

      const nuevoEst = estRes.rows[0];

      // 2. Crear sucursal principal
      const sucRes = await query(
        `INSERT INTO sucursales (
           id_establecimiento, nombre, direccion, latitud, longitud,
           telefono, es_principal, estado, fecha_creacion
         ) VALUES ($1, $2, $3, $4, $5, $6, 1, 1, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          nuevoEst.id_establecimiento,
          "Sede Principal",
          direccion.trim(),
          lat != null ? Number(lat) : null,
          lng != null ? Number(lng) : null,
          telefono?.trim() || null,
        ],
      );

      // 3. Crear programa de sellos básico y regla de puntos
      try {
        const ptsVisita = req.body.puntos_por_visita ? Number(req.body.puntos_por_visita) : 20;
        let iconoPorCategoria = '🏛️';
        if (categoria_id) {
          const catRes = await query(`SELECT icono_url FROM categorias_establecimiento WHERE id = $1`, [categoria_id]);
          if (catRes.rows[0]?.icono_url) {
            iconoPorCategoria = catRes.rows[0].icono_url;
          }
        }
        await query(
          `INSERT INTO programas_sellos (
             id_establecimiento, nombre, meta_sellos, nombre_sello, imagen_sello, puntos_por_visita, estado
           ) VALUES ($1, $2, 8, $3, $4, $5, 'ACTIVO')
           ON CONFLICT (id_establecimiento) DO NOTHING`,
          [
            nuevoEst.id_establecimiento,
            `Pasaporte ${razon_social.trim()}`,
            `Sello ${razon_social.trim()}`,
            iconoPorCategoria,
            ptsVisita,
          ],
        );
        await query(
          `INSERT INTO reglas_sellos (
             establecimiento_id, nombre_accion, valor_puntos_por_sello, limite_diario_por_usuario, estado
           ) VALUES ($1, 'Visita con Sello NFC', $2, 1, 'ACTIVA')`,
          [nuevoEst.id_establecimiento, ptsVisita],
        );
      } catch {
        // no fallar si ya existiera
      }

      // 4. Si se indicó un usuario comercio, vincularlo a la sucursal principal
      if (usuario_id) {
        await query(
          `INSERT INTO usuario_sucursal (id_usuario, id_sucursal, estado)
           VALUES ($1, $2, 1)
           ON CONFLICT (id_usuario, id_sucursal) DO UPDATE SET estado = 1`,
          [usuario_id, sucRes.rows[0].id_sucursal],
        );
      }

      sendResponse(
        res,
        201,
        { ...nuevoEst, id: nuevoEst.id_establecimiento, id_sucursal: sucRes.rows[0].id_sucursal },
        "Local creado con éxito",
      );
    } catch (error) {
      next(error);
    }
  },

  async actualizarLocal(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const {
        razon_social,
        ruc,
        direccion,
        lat,
        lng,
        descripcion,
        telefono,
        email,
        categoria_id,
        imagen_url,
        estado,
        usuario_id,
        puntos_por_visita,
      } = req.body;

      const estActual = await query(
        `SELECT * FROM establecimientos WHERE id_establecimiento = $1`,
        [id],
      );
      if (!estActual.rows[0]) {
        throw new ApiError(404, "Establecimiento no encontrado");
      }

      // 1. Actualizar establecimiento
      const hasCategoria = categoria_id !== undefined;
      const catVal =
        categoria_id && Number(categoria_id) > 0
          ? Number(categoria_id)
          : null;

      const result = await query(
        `UPDATE establecimientos
         SET 
           nombre_comercial = COALESCE($2, nombre_comercial),
           razon_social = COALESCE($2, razon_social),
           ruc = COALESCE($3, ruc),
           descripcion = COALESCE($4, descripcion),
           telefono = COALESCE($5, telefono),
           email = COALESCE($6, email),
           categoria_id = CASE WHEN $7::boolean THEN $8::int ELSE categoria_id END,
           imagen_portada = COALESCE($9, imagen_portada),
           logo = COALESCE($9, logo),
           estado = COALESCE($10, estado)
         WHERE id_establecimiento = $1
         RETURNING *`,
        [
          id,
          razon_social?.trim() ?? null,
          ruc?.trim() ?? null,
          descripcion !== undefined ? descripcion : null,
          telefono !== undefined ? telefono : null,
          email !== undefined ? email : null,
          hasCategoria,
          catVal,
          imagen_url !== undefined ? imagen_url : null,
          estado ?? null,
        ],
      );

      // 2. Actualizar o crear sucursal principal
      let sucPrincipal = await query(
        `SELECT id_sucursal FROM sucursales WHERE id_establecimiento = $1 AND es_principal = 1 LIMIT 1`,
        [id],
      );

      if (sucPrincipal.rows[0]) {
        await query(
          `UPDATE sucursales
           SET 
             direccion = COALESCE($2, direccion),
             latitud = COALESCE($3::numeric, latitud),
             longitud = COALESCE($4::numeric, longitud),
             telefono = COALESCE($5, telefono)
           WHERE id_sucursal = $1`,
          [
            sucPrincipal.rows[0].id_sucursal,
            direccion?.trim() ?? null,
            lat != null ? Number(lat) : null,
            lng != null ? Number(lng) : null,
            telefono?.trim() ?? null,
          ],
        );
      } else if (direccion) {
        const newSuc = await query(
          `INSERT INTO sucursales (id_establecimiento, nombre, direccion, latitud, longitud, telefono, es_principal, estado)
           VALUES ($1, 'Sede Principal', $2, $3, $4, $5, 1, 1)
           RETURNING id_sucursal`,
          [
            id,
            direccion.trim(),
            lat != null ? Number(lat) : null,
            lng != null ? Number(lng) : null,
            telefono?.trim() || null,
          ],
        );
        sucPrincipal = newSuc;
      }

      // 3. Reasignación o vinculación de usuario comercio
      if (usuario_id !== undefined && sucPrincipal.rows[0]) {
        const sucId = sucPrincipal.rows[0].id_sucursal;
        await query(`DELETE FROM usuario_sucursal WHERE id_sucursal = $1`, [sucId]);
        if (usuario_id) {
          await query(`DELETE FROM usuario_sucursal WHERE id_usuario = $1`, [usuario_id]);
          await query(
            `INSERT INTO usuario_sucursal (id_usuario, id_sucursal, estado)
             VALUES ($1, $2, 1)
             ON CONFLICT (id_usuario, id_sucursal) DO UPDATE SET estado = 1`,
            [usuario_id, sucId],
          );
        }
      }

      // 4. Actualizar puntos por visita en programas_sellos y reglas_sellos
      if (puntos_por_visita !== undefined && Number(puntos_por_visita) > 0) {
        const pts = Number(puntos_por_visita);
        const progRes = await query(
          `UPDATE programas_sellos 
           SET puntos_por_visita = $1, fecha_actualizacion = CURRENT_TIMESTAMP 
           WHERE id_establecimiento = $2 RETURNING id_programa`,
          [pts, id],
        );
        if (progRes.rows.length === 0) {
          await query(
            `INSERT INTO programas_sellos (
               id_establecimiento, nombre, meta_sellos, nombre_sello, imagen_sello, puntos_por_visita, estado
             ) VALUES ($1, $2, 8, 'Visita', '☕', $3, 'ACTIVO')
             ON CONFLICT (id_establecimiento) DO NOTHING`,
            [id, `Pasaporte ${estActual.rows[0].nombre_comercial}`, pts],
          );
        }

        const regRes = await query(
          `UPDATE reglas_sellos 
           SET valor_puntos_por_sello = $1 
           WHERE establecimiento_id = $2 RETURNING id`,
          [pts, id],
        );
        if (regRes.rows.length === 0) {
          await query(
            `INSERT INTO reglas_sellos (
               establecimiento_id, nombre_accion, valor_puntos_por_sello, limite_diario_por_usuario, estado
             ) VALUES ($1, 'Visita con Sello NFC', $2, 1, 'ACTIVA')`,
            [id, pts],
          );
        }
      }

      sendResponse(res, 200, result.rows[0], "Local actualizado con éxito");
    } catch (error) {
      console.error("ERROR ACTUALIZAR LOCAL:", error);
      next(error);
    }
  },

  async eliminarLocal(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const { modo = "SOFT" } = req.body; // 'SOFT' (desactivar) o 'FORCE' (eliminar dependencias y borrar)

      const est = await query(
        `SELECT id_establecimiento, nombre_comercial FROM establecimientos WHERE id_establecimiento = $1`,
        [id],
      );
      if (!est.rows[0]) throw new ApiError(404, "Establecimiento no encontrado");

      if (modo === "SOFT") {
        // Desactivación lógica (recomendada para preservar historial de visitas y puntos)
        await query(
          `UPDATE establecimientos SET estado = 'INACTIVO' WHERE id_establecimiento = $1`,
          [id],
        );
        await query(
          `UPDATE sucursales SET estado = 0 WHERE id_establecimiento = $1`,
          [id],
        );
        return sendResponse(
          res,
          200,
          null,
          "Establecimiento desactivado correctamente (Historial preservado)",
        );
      }

      // Modo Eliminación Completa (FORCE): limpiar relaciones para evitar fallo por RESTRICT
      const sucursales = await query(
        `SELECT id_sucursal FROM sucursales WHERE id_establecimiento = $1`,
        [id],
      );
      const sucIds = sucursales.rows.map((s: any) => s.id_sucursal);

      if (sucIds.length > 0) {
        // Desvincular usuarios asociados a las sucursales
        await query(`DELETE FROM usuario_sucursal WHERE id_sucursal = ANY($1)`, [sucIds]);
        // Limpiar visitas de estas sucursales
        await query(
          `DELETE FROM sellos_digitales WHERE id_visita IN (SELECT id_visita FROM visitas WHERE id_sucursal = ANY($1))`,
          [sucIds],
        );
        await query(`DELETE FROM visitas WHERE id_sucursal = ANY($1)`, [sucIds]);
        // Reclamaciones
        await query(`DELETE FROM reclamaciones WHERE id_sucursal = ANY($1) OR id_establecimiento = $2`, [sucIds, id]);
        // Recompensas
        await query(`DELETE FROM canjes WHERE id_recompensa IN (SELECT id_recompensa FROM recompensas WHERE id_establecimiento = $1)`, [id]);
        await query(`DELETE FROM recompensas WHERE id_establecimiento = $1`, [id]);
        // Reglas de sellos y programas
        await query(`DELETE FROM reglas_puntos WHERE id_programa IN (SELECT id_programa FROM programas_sellos WHERE id_establecimiento = $1)`, [id]);
        await query(`DELETE FROM programas_sellos WHERE id_establecimiento = $1`, [id]);
        await query(`DELETE FROM reglas_sellos WHERE establecimiento_id = $1`, [id]);
        // Borrar sucursales
        await query(`DELETE FROM sucursales WHERE id_establecimiento = $1`, [id]);
      } else {
        await query(`DELETE FROM reclamaciones WHERE id_establecimiento = $1`, [id]);
        await query(`DELETE FROM recompensas WHERE id_establecimiento = $1`, [id]);
        await query(`DELETE FROM programas_sellos WHERE id_establecimiento = $1`, [id]);
        await query(`DELETE FROM reglas_sellos WHERE establecimiento_id = $1`, [id]);
      }

      // Borrar establecimiento
      await query(`DELETE FROM establecimientos WHERE id_establecimiento = $1`, [id]);

      sendResponse(res, 200, null, "Establecimiento eliminado definitivamente");
    } catch (error) {
      next(error);
    }
  },

  // ===== GESTIÓN Y DISEÑO DE SELLOS DIGITALES =====
  /** Listar diseños de sellos de todos los establecimientos */
  async listarSellos(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { estado, q } = req.query;

      // Auto-provisionar programa de sellos básico para establecimientos que no tengan uno
      await query(`
        INSERT INTO programas_sellos (
          id_establecimiento, nombre, descripcion, meta_sellos, max_sellos_visita, nombre_sello, imagen_sello, color_sello, estado
        )
        SELECT 
          e.id_establecimiento,
          'Pasaporte ' || e.nombre_comercial,
          'Programa de fidelización de ' || e.nombre_comercial,
          8,
          1,
          'Sello ' || e.nombre_comercial,
          COALESCE(e.logo, cat.icono_url, '🏛️'),
          '#7C0A1E',
          'ACTIVO'
        FROM establecimientos e
        LEFT JOIN categorias_establecimiento cat ON cat.id = e.categoria_id
        WHERE NOT EXISTS (
          SELECT 1 FROM programas_sellos ps WHERE ps.id_establecimiento = e.id_establecimiento
        )
        ON CONFLICT (id_establecimiento) DO NOTHING
      `);

      let sql = `
        SELECT 
          ps.id_programa AS id,
          ps.id_programa,
          ps.id_establecimiento,
          e.nombre_comercial AS establecimiento_nombre,
          e.razon_social,
          e.logo AS establecimiento_logo,
          e.imagen_portada AS establecimiento_portada,
          ps.nombre,
          ps.descripcion,
          ps.nombre_sello,
          COALESCE(ps.imagen_sello, cat.icono_url, '🏛️') AS imagen_sello,
          COALESCE(ps.color_sello, '#7C0A1E') AS color_sello,
          COALESCE(ps.puntos_por_visita, 20) AS puntos_por_visita,
          ps.meta_sellos,
          ps.max_sellos_visita,
          ps.estado,
          ps.fecha_actualizacion,
          cat.nombre AS categoria_nombre,
          cat.icono_url AS categoria_icono,
          (SELECT COUNT(*)::int FROM sellos_digitales sd WHERE sd.id_programa = ps.id_programa AND sd.estado = 'OTORGADO') AS total_sellos_otorgados
        FROM programas_sellos ps
        JOIN establecimientos e ON e.id_establecimiento = ps.id_establecimiento
        LEFT JOIN categorias_establecimiento cat ON cat.id = e.categoria_id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (estado && estado !== "TODOS") {
        params.push(estado);
        sql += ` AND ps.estado = $${params.length}`;
      }

      if (q && String(q).trim()) {
        params.push(`%${String(q).trim()}%`);
        sql += ` AND (e.nombre_comercial ILIKE $${params.length} OR ps.nombre_sello ILIKE $${params.length} OR ps.descripcion ILIKE $${params.length})`;
      }

      sql += ` ORDER BY ps.fecha_actualizacion DESC`;
      const result = await query(sql, params);
      sendResponse(res, 200, result.rows, "Diseños de sellos obtenidos");
    } catch (error) {
      next(error);
    }
  },

  /** Crear o configurar un nuevo diseño de sello para un establecimiento */
  async crearSello(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const {
        id_establecimiento,
        nombre_sello,
        imagen_sello,
        color_sello,
        descripcion,
        meta_sellos,
        puntos_por_visita,
        estado,
      } = req.body;

      if (!id_establecimiento) {
        throw new ApiError(400, "El establecimiento es obligatorio");
      }

      const estCheck = await query(`SELECT nombre_comercial FROM establecimientos WHERE id_establecimiento = $1`, [id_establecimiento]);
      if (!estCheck.rows[0]) throw new ApiError(404, "Establecimiento no encontrado");

      const nombreEst = estCheck.rows[0].nombre_comercial;

      const result = await query(
        `INSERT INTO programas_sellos (
           id_establecimiento, nombre, descripcion, meta_sellos, max_sellos_visita,
           nombre_sello, imagen_sello, color_sello, puntos_por_visita, estado, fecha_actualizacion
         ) VALUES ($1, $2, $3, $4, 1, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          id_establecimiento,
          `Pasaporte ${nombreEst}`,
          descripcion || `Programa de sellos de ${nombreEst}`,
          meta_sellos ? Number(meta_sellos) : 8,
          nombre_sello || `Sello ${nombreEst}`,
          imagen_sello || "☕",
          color_sello || "#7C0A1E",
          puntos_por_visita ? Number(puntos_por_visita) : 20,
          estado || "ACTIVO",
        ],
      );

      sendResponse(res, 201, result.rows[0], "Diseño de sello creado exitosamente");
    } catch (error) {
      next(error);
    }
  },

  /** Actualizar / moderar diseño de sello de un local */
  async actualizarSello(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const {
        nombre_sello,
        imagen_sello,
        color_sello,
        descripcion,
        meta_sellos,
        puntos_por_visita,
        estado,
      } = req.body;

      const check = await query(`SELECT * FROM programas_sellos WHERE id_programa = $1`, [id]);
      if (!check.rows[0]) throw new ApiError(404, "Programa de sello no encontrado");

      const result = await query(
        `UPDATE programas_sellos
         SET 
           nombre_sello = COALESCE($2, nombre_sello),
           imagen_sello = COALESCE($3, imagen_sello),
           color_sello = COALESCE($4, color_sello),
           descripcion = COALESCE($5, descripcion),
           meta_sellos = CASE WHEN $6 IS NOT NULL THEN $6::int ELSE meta_sellos END,
           puntos_por_visita = CASE WHEN $7 IS NOT NULL THEN $7::int ELSE puntos_por_visita END,
           estado = COALESCE($8, estado),
           fecha_actualizacion = CURRENT_TIMESTAMP
         WHERE id_programa = $1
         RETURNING *`,
        [
          id,
          nombre_sello !== undefined ? nombre_sello.trim() : null,
          imagen_sello !== undefined ? imagen_sello.trim() : null,
          color_sello !== undefined ? color_sello.trim() : null,
          descripcion !== undefined ? descripcion.trim() : null,
          meta_sellos !== undefined ? Number(meta_sellos) : null,
          puntos_por_visita !== undefined ? Number(puntos_por_visita) : null,
          estado || null,
        ],
      );

      if (puntos_por_visita !== undefined && result.rows[0]?.id_establecimiento) {
        await query(
          `UPDATE reglas_sellos 
           SET valor_puntos_por_sello = $1 
           WHERE establecimiento_id = $2`,
          [Number(puntos_por_visita), result.rows[0].id_establecimiento],
        );
      }

      sendResponse(res, 200, result.rows[0], "Diseño de sello actualizado exitosamente");
    } catch (error) {
      next(error);
    }
  },

  /** Eliminar o resetear diseño de sello inapropiado (moderación) */
  async eliminarSello(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const check = await query(
        `SELECT COUNT(*)::int AS total FROM sellos_digitales WHERE id_programa = $1`,
        [id],
      );
      if (check.rows[0] && check.rows[0].total > 0) {
        await query(
          `UPDATE programas_sellos
           SET 
             nombre_sello = 'Sello Estándar',
             imagen_sello = '🏛️',
             color_sello = '#7C0A1E',
             descripcion = 'Sello digital verificado por administración',
             estado = 'ACTIVO',
             fecha_actualizacion = CURRENT_TIMESTAMP
           WHERE id_programa = $1`,
          [id],
        );
        sendResponse(res, 200, null, "Sello reseteado a valores estándar por moderación");
      } else {
        await query(`DELETE FROM programas_sellos WHERE id_programa = $1`, [id]);
        sendResponse(res, 200, null, "Diseño de sello eliminado correctamente");
      }
    } catch (error) {
      next(error);
    }
  },
};

