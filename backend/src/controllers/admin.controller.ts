import { Response, NextFunction } from "express";
import { query } from "../config/database";
import { ApiError, sendResponse, hashPassword } from "../utils";
import { AuthenticatedRequest } from "../types";

export const AdminController = {
  /** Dashboard: contadores generales */
  async dashboard(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
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
        actividadReciente,
      ] = await Promise.all([
        query(`SELECT COUNT(*)::int AS total FROM usuarios`),
        query(
          `SELECT COUNT(*)::int AS total FROM establecimientos WHERE estado = 'ACTIVO'`,
        ),
        query(`SELECT COUNT(*)::int AS total FROM historial_visitas_sellos`),
        query(
          `SELECT COUNT(*)::int AS total FROM historial_visitas_sellos WHERE fecha_hora >= CURRENT_DATE`,
        ),
        query(`SELECT COUNT(*)::int AS total FROM historial_canjes`),
        query(
          `SELECT COUNT(*)::int AS total FROM publicaciones WHERE estado_moderacion = 'APROBADA'`,
        ),
        query(`SELECT COUNT(*)::int AS total FROM tarjetas_nfc`),
        query(
          `SELECT COUNT(*)::int AS total FROM tarjetas_nfc WHERE estado = 'EN_STOCK'`,
        ),
        query(
          `SELECT COUNT(*)::int AS total FROM libro_reclamaciones WHERE estado = 'PENDIENTE'`,
        ),
        query(
          `SELECT h.id, h.puntos_ganados, h.metodo_validacion, h.fecha_hora,
                  u.nombres || ' ' || COALESCE(u.apellidos, '') AS usuario_nombre,
                  e.nombre AS establecimiento_nombre
           FROM historial_visitas_sellos h
           JOIN usuarios u ON u.id = h.usuario_id
           JOIN establecimientos e ON e.id = h.establecimiento_id
           ORDER BY h.fecha_hora DESC
           LIMIT 5`,
        ),
      ]);

      sendResponse(
        res,
        200,
        {
          usuarios: usuarios.rows[0].total,
          establecimientos_activos: locales.rows[0].total,
          visitas_totales: visitas.rows[0].total,
          visitas_hoy: visitasHoy.rows[0].total,
          canjes_totales: canjes.rows[0].total,
          publicaciones: publicaciones.rows[0].total,
          tarjetas_nfc: tarjetas.rows[0].total,
          tarjetas_stock: tarjetasStock.rows[0].total,
          reclamaciones_pendientes: reclamaciones.rows[0].total,
          actividad_reciente: actividadReciente.rows,
        },
        "Dashboard admin",
      );
    } catch (error) {
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
        SELECT u.id, u.nombres, u.apellidos, u.email, u.total_sellos, u.puntos_globales,
               u.estado, u.created_at, r.nombre AS rol_nombre, n.nombre_rango AS nivel_nombre
        FROM usuarios u
        JOIN roles r ON r.id = u.rol_id
        LEFT JOIN niveles_pasaporte n ON n.id = u.nivel_id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (rol) {
        params.push(rol);
        sql += ` AND r.nombre = $${params.length}`;
      }
      if (estado) {
        params.push(estado);
        sql += ` AND u.estado = $${params.length}`;
      }
      if (q && String(q).trim()) {
        params.push(`%${String(q).trim()}%`);
        sql += ` AND (u.email ILIKE $${params.length} OR u.nombres ILIKE $${params.length} OR u.apellidos ILIKE $${params.length})`;
      }

      sql += " ORDER BY u.created_at DESC LIMIT 200";
      const result = await query(sql, params);
      sendResponse(res, 200, result.rows, "Usuarios");
    } catch (error) {
      next(error);
    }
  },

  /** Cambiar estado de usuario (ACTIVO / INACTIVO / BLOQUEADO) */
  async cambiarEstadoUsuario(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      if (!["ACTIVO", "INACTIVO", "BLOQUEADO"].includes(estado)) {
        throw new ApiError(400, "Estado inválido");
      }

      const result = await query(
        `UPDATE usuarios SET estado = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id, email, nombres, apellidos, estado`,
        [id, estado],
      );
      if (!result.rows[0]) throw new ApiError(404, "Usuario no encontrado");
      sendResponse(res, 200, result.rows[0], "Estado actualizado");
    } catch (error) {
      next(error);
    }
  },

  /** Cambiar rol de usuario */
  async cambiarRolUsuario(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const { rol } = req.body; // ADMIN | CLIENTE | COMERCIO

      const roleRes = await query(`SELECT id FROM roles WHERE nombre = $1`, [
        rol,
      ]);
      if (!roleRes.rows[0]) throw new ApiError(400, "Rol no existe");

      const result = await query(
        `UPDATE usuarios SET rol_id = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id, email`,
        [id, roleRes.rows[0].id],
      );
      if (!result.rows[0]) throw new ApiError(404, "Usuario no encontrado");
      sendResponse(res, 200, { ...result.rows[0], rol }, "Rol actualizado");
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
        SELECT t.*, u.nombres, u.apellidos, u.email
        FROM tarjetas_nfc t
        LEFT JOIN usuarios u ON u.id = t.usuario_id
        WHERE 1=1
      `;
      const params: any[] = [];
      if (estado) {
        params.push(estado);
        sql += ` AND t.estado = $${params.length}`;
      }
      sql += " ORDER BY t.created_at DESC LIMIT 500";
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
        const qr = `https://pasaporte.nfc/r/${String(uid).replace(/[^a-zA-Z0-9]/g, "")}`;
        try {
          const r = await query(
            `INSERT INTO tarjetas_nfc (uid_nfc, qr_respaldo, estado)
             VALUES ($1, $2, 'EN_STOCK')
             ON CONFLICT (uid_nfc) DO NOTHING
             RETURNING *`,
            [uid, qr],
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
        "Tarjetas registradas en stock",
      );
    } catch (error) {
      next(error);
    }
  },

  /** Bloquear / marcar extraviada una tarjeta */
  async cambiarEstadoTarjeta(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      if (
        !["EN_STOCK", "ASIGNADA", "EXTRAVIADA", "BLOQUEADA"].includes(estado)
      ) {
        throw new ApiError(400, "Estado de tarjeta inválido");
      }

      const result = await query(
        `UPDATE tarjetas_nfc SET estado = $2 WHERE id = $1 RETURNING *`,
        [id, estado],
      );
      if (!result.rows[0]) throw new ApiError(404, "Tarjeta no encontrada");
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
        tipo_entrega,
        direccion_recojo,
        fecha_inicio,
        fecha_fin,
      } = req.body;

      if (!nombre_recompensa || costo_puntos_globales == null) {
        throw new ApiError(
          400,
          "nombre_recompensa y costo_puntos_globales son obligatorios",
        );
      }

      if (
        !Number.isInteger(Number(costo_puntos_globales)) ||
        Number(costo_puntos_globales) < 0 ||
        (stock_disponible != null &&
          (!Number.isInteger(Number(stock_disponible)) ||
            Number(stock_disponible) < 0))
      )
        throw new ApiError(
          400,
          "Puntos y stock deben ser enteros no negativos",
        );
      const result = await query(
        `INSERT INTO recompensas_plataforma
           (nombre_recompensa, descripcion, costo_puntos_globales, stock_disponible,
            imagen_url, tipo_entrega, direccion_recojo, fecha_inicio, fecha_fin, estado)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'ACTIVA')
         RETURNING *`,
        [
          nombre_recompensa,
          descripcion || null,
          costo_puntos_globales,
          stock_disponible ?? null,
          imagen_url || null,
          tipo_entrega || "OFICINA_CENTRAL",
          direccion_recojo || null,
          fecha_inicio || null,
          fecha_fin || null,
        ],
      );

      sendResponse(res, 201, result.rows[0], "Recompensa creada");
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
        `SELECT * FROM recompensas_plataforma ORDER BY created_at DESC`,
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
        tipo_entrega,
        direccion_recojo,
        fecha_inicio,
        fecha_fin,
        estado,
      } = req.body;

      const current = await query(
        `SELECT * FROM recompensas_plataforma WHERE id = $1`,
        [id],
      );
      if (!current.rows.length) {
        throw new ApiError(404, "Recompensa no encontrada");
      }

      const result = await query(
        `UPDATE recompensas_plataforma
         SET nombre_recompensa = COALESCE($1, nombre_recompensa),
             descripcion = COALESCE($2, descripcion),
             costo_puntos_globales = COALESCE($3, costo_puntos_globales),
             stock_disponible = COALESCE($4, stock_disponible),
             imagen_url = COALESCE($5, imagen_url),
             tipo_entrega = COALESCE($6, tipo_entrega),
             direccion_recojo = COALESCE($7, direccion_recojo),
             fecha_inicio = COALESCE($8, fecha_inicio),
             fecha_fin = COALESCE($9, fecha_fin),
             estado = COALESCE($10, estado)
         WHERE id = $11
         RETURNING *`,
        [
          nombre_recompensa ?? null,
          descripcion !== undefined ? descripcion : null,
          costo_puntos_globales != null ? Number(costo_puntos_globales) : null,
          stock_disponible !== undefined ? (stock_disponible != null ? Number(stock_disponible) : null) : null,
          imagen_url !== undefined ? imagen_url : null,
          tipo_entrega ?? null,
          direccion_recojo !== undefined ? direccion_recojo : null,
          fecha_inicio !== undefined ? fecha_inicio : null,
          fecha_fin !== undefined ? fecha_fin : null,
          estado ?? null,
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
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await query(`
        SELECT r.*, e.razon_social AS establecimiento_nombre
        FROM reglas_sellos r
        LEFT JOIN establecimientos e ON e.id = r.establecimiento_id
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
        nombre_accion,
        valor_puntos_por_sello = 10,
        limite_diario_por_usuario = 1,
        estado = "ACTIVA",
        fecha_inicio = null,
        fecha_fin = null,
      } = req.body;

      if (!establecimiento_id || !nombre_accion) {
        throw new ApiError(
          400,
          "establecimiento_id y nombre_accion son obligatorios",
        );
      }

      const result = await query(
        `INSERT INTO reglas_sellos (
           establecimiento_id, nombre_accion, valor_puntos_por_sello,
           limite_diario_por_usuario, estado, fecha_inicio, fecha_fin
         ) VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING *`,
        [
          establecimiento_id,
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
      sendResponse(res, 200, result.rows[0], "Regla actualizada");
    } catch (error) {
      next(error);
    }
  },
};
