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
      // Execute queries in two batches to avoid hitting Supabase pool limits (max 15)
      const batch1 = await Promise.all([
        query(`SELECT COUNT(*)::int AS total FROM usuarios`),
        query(
          `SELECT COUNT(*)::int AS total,
                  COUNT(CASE WHEN estado = 'ACTIVO' THEN 1 END)::int AS activos,
                  COUNT(CASE WHEN estado = 'INACTIVO' THEN 1 END)::int AS inactivos
           FROM establecimientos`,
        ),
        query(`SELECT COUNT(*)::int AS total FROM historial_visitas_sellos`),
        query(
          `SELECT COUNT(*)::int AS total, COALESCE(SUM(puntos_ganados), 0)::int AS puntos_hoy 
           FROM historial_visitas_sellos WHERE fecha_hora >= CURRENT_DATE`,
        ),
        query(
          `SELECT COUNT(*)::int AS total,
                  COUNT(CASE WHEN estado_entrega = 'PENDIENTE_RECOJO' THEN 1 END)::int AS pendientes
           FROM historial_canjes`,
        ),
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
      ]);

      const batch2 = await Promise.all([
        query(
          `SELECT COUNT(*)::int AS total FROM denuncias_moderacion WHERE estado_revision = 'PENDIENTE'`,
        ),
        query(
          `SELECT h.id, h.puntos_ganados, h.metodo_validacion, h.fecha_hora,
                  u.nombres || ' ' || COALESCE(u.apellidos, '') AS usuario_nombre,
                  u.avatar_url AS usuario_avatar,
                  e.nombre AS establecimiento_nombre
           FROM historial_visitas_sellos h
           JOIN usuarios u ON u.id = h.usuario_id
           JOIN establecimientos e ON e.id = h.establecimiento_id
           ORDER BY h.fecha_hora DESC
           LIMIT 8`,
        ),
        query(
          `SELECT 
             TO_CHAR(d.fecha, 'YYYY-MM-DD') AS fecha,
             TO_CHAR(d.fecha, 'Dy') AS dia_nombre,
             COUNT(u.id)::int AS nuevos_clientes
           FROM generate_series(
             DATE_TRUNC('week', CURRENT_DATE)::date,
             (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::date,
             '1 day'::interval
           ) d(fecha)
           LEFT JOIN usuarios u ON DATE(u.created_at) = DATE(d.fecha) 
           AND u.rol_id = (SELECT id FROM roles WHERE nombre = 'CLIENTE' LIMIT 1)
           GROUP BY d.fecha
           ORDER BY d.fecha ASC`,
        ),
        query(
          `SELECT r.nombre AS rol, COUNT(u.id)::int AS total
           FROM roles r
           LEFT JOIN usuarios u ON u.rol_id = r.id
           GROUP BY r.nombre`,
        ),
        query(
          `SELECT n.nombre_rango AS nivel, n.color_hex, COUNT(u.id)::int AS total
           FROM niveles_pasaporte n
           LEFT JOIN usuarios u ON u.nivel_id = n.id
           GROUP BY n.id, n.nombre_rango, n.color_hex, n.sellos_requeridos
           ORDER BY n.sellos_requeridos ASC`,
        ),
        query(
          `SELECT 
             COALESCE(metodo_validacion, 'NFC') AS metodo,
             COUNT(*)::int AS total
           FROM historial_visitas_sellos
           GROUP BY metodo_validacion`,
        ),
        query(
          `SELECT 
             e.id, 
             e.nombre, 
             e.imagen_url,
             COUNT(h.id)::int AS total_sellos,
             COALESCE(SUM(h.puntos_ganados), 0)::int AS total_puntos
           FROM establecimientos e
           JOIN historial_visitas_sellos h ON h.establecimiento_id = e.id
           GROUP BY e.id, e.nombre, e.imagen_url
           ORDER BY total_sellos DESC
           LIMIT 5`,
        ),
        query(
          `SELECT 
             COUNT(*)::int AS total,
             COUNT(CASE WHEN estado = 'EN_STOCK' THEN 1 END)::int AS en_stock,
             COUNT(CASE WHEN estado = 'ASIGNADA' THEN 1 END)::int AS asignadas,
             COUNT(CASE WHEN estado = 'EXTRAVIADA' THEN 1 END)::int AS extraviadas,
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
        SELECT u.id, u.nombres, u.apellidos, u.email, u.avatar_url, u.total_sellos, u.puntos_globales,
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

  /** Actualizar usuario (nombres, apellidos, email, rol, estado) */
  async actualizarUsuario(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const { nombres, apellidos, email, rol, estado } = req.body;

      let sql = `UPDATE usuarios SET updated_at = CURRENT_TIMESTAMP`;
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
        params.push(email);
        sql += `, email = $${paramIndex++}`;
      }
      if (estado !== undefined) {
        if (!["ACTIVO", "INACTIVO", "BLOQUEADO"].includes(estado)) {
          throw new ApiError(400, "Estado inválido");
        }
        params.push(estado);
        sql += `, estado = $${paramIndex++}`;
      }
      if (rol !== undefined) {
        const roleRes = await query(`SELECT id FROM roles WHERE nombre = $1`, [rol]);
        if (!roleRes.rows[0]) throw new ApiError(400, "Rol no existe");
        params.push(roleRes.rows[0].id);
        sql += `, rol_id = $${paramIndex++}`;
      }

      sql += ` WHERE id = $${paramIndex} RETURNING id`;
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
        `SELECT u.email, r.nombre as rol_nombre FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.id = $1`,
        [id]
      );
      if (!checkRes.rows[0]) throw new ApiError(404, "Usuario no encontrado");
      if (checkRes.rows[0].rol_nombre === "ADMIN") {
        throw new ApiError(403, "No se puede eliminar a un administrador");
      }

      await query(`DELETE FROM usuarios WHERE id = $1`, [id]);
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
           c.*,
           COUNT(e.id)::int AS total_locales
         FROM categorias_establecimiento c
         LEFT JOIN establecimientos e ON e.categoria_id = c.id
         GROUP BY c.id
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
        [nombre.trim(), icono_url || null, estado !== undefined ? Boolean(estado) : true],
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

      // Verificar si hay locales asociados
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
          c.id,
          c.puntos_gastados,
          c.estado_entrega,
          c.fecha_canje,
          c.fecha_entrega,
          u.id AS usuario_id,
          u.nombres || ' ' || u.apellidos AS usuario_nombre,
          u.email AS usuario_email,
          u.avatar_url AS usuario_avatar,
          r.id AS recompensa_id,
          r.nombre_recompensa,
          r.imagen_url AS recompensa_imagen,
          r.tipo_entrega,
          r.direccion_recojo
        FROM historial_canjes c
        JOIN usuarios u ON u.id = c.usuario_id
        JOIN recompensas_plataforma r ON r.id = c.recompensa_id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (estado && estado !== "TODOS") {
        params.push(estado);
        sql += ` AND c.estado_entrega = $${params.length}`;
      }
      if (q && String(q).trim()) {
        params.push(`%${String(q).trim()}%`);
        sql += ` AND (
          u.nombres ILIKE $${params.length} OR 
          u.apellidos ILIKE $${params.length} OR 
          u.email ILIKE $${params.length} OR 
          r.nombre_recompensa ILIKE $${params.length}
        )`;
      }

      sql += ` ORDER BY c.fecha_canje DESC LIMIT 200`;
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

      if (!["PENDIENTE_RECOJO", "ENTREGADO", "CANCELADO"].includes(estado_entrega)) {
        throw new ApiError(400, "Estado de entrega inválido");
      }

      const canjeActual = await query(
        `SELECT * FROM historial_canjes WHERE id = $1`,
        [id],
      );
      if (!canjeActual.rows[0]) throw new ApiError(404, "Canje no encontrado");

      // Si se cancela, devolvemos puntos al usuario y sumamos stock
      if (estado_entrega === "CANCELADO" && canjeActual.rows[0].estado_entrega !== "CANCELADO") {
        await query(
          `UPDATE usuarios SET puntos_globales = puntos_globales + $1 WHERE id = $2`,
          [canjeActual.rows[0].puntos_gastados, canjeActual.rows[0].usuario_id],
        );
        await query(
          `UPDATE recompensas_plataforma SET stock_disponible = stock_disponible + 1 WHERE id = $1`,
          [canjeActual.rows[0].recompensa_id],
        );
      }

      const result = await query(
        `UPDATE historial_canjes 
         SET estado_entrega = $2,
             fecha_entrega = CASE WHEN $2 = 'ENTREGADO' THEN CURRENT_TIMESTAMP ELSE fecha_entrega END
         WHERE id = $1
         RETURNING *`,
        [id, estado_entrega],
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
            c.id, c.fecha_canje, c.puntos_gastados,
            u.nombres || ' ' || u.apellidos AS usuario_nombre,
            u.avatar_url,
            r.nombre_recompensa
          FROM historial_canjes c
          JOIN usuarios u ON u.id = c.usuario_id
          JOIN recompensas_plataforma r ON r.id = c.recompensa_id
          WHERE c.estado_entrega = 'PENDIENTE_RECOJO'
          ORDER BY c.fecha_canje DESC
          LIMIT 5
        `),
        query(`
          SELECT 
            id, codigo_seguimiento, tipo_registro, nombres_reclamante, created_at
          FROM libro_reclamaciones
          WHERE estado = 'PENDIENTE'
          ORDER BY created_at DESC
          LIMIT 5
        `),
      ]);

      const countCanjes = await query(
        `SELECT COUNT(*)::int AS count FROM historial_canjes WHERE estado_entrega = 'PENDIENTE_RECOJO'`,
      );
      const countReclamos = await query(
        `SELECT COUNT(*)::int AS count FROM libro_reclamaciones WHERE estado = 'PENDIENTE'`,
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
};
