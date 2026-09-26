import { Response, NextFunction } from "express";
import { query } from "../config/database";
import { ApiError, sendResponse } from "../utils";
import { AuthenticatedRequest } from "../types";

export const EstablishmentsController = {
  /** Listar establecimientos y sus sucursales (para la pantalla Explorar) */
  async listar(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { q, categoria } = req.query;

      let sql = `
        SELECT 
          e.id_establecimiento,
          e.nombre_comercial,
          e.razon_social,
          e.descripcion,
          e.logo,
          e.imagen_portada,
          e.telefono,
          e.email,
          e.estado,
          -- Programa de sellos activo
          ps.id_programa,
          ps.nombre AS programa_nombre,
          ps.meta_sellos,
          ps.nombre_sello,
          ps.imagen_sello,
          ps.color_sello,
          COALESCE(rp.valor, 20) AS puntos_por_visita,
          -- Sucursales agrupadas en JSON
          COALESCE(
            json_agg(
              json_build_object(
                'id_sucursal', s.id_sucursal,
                'nombre', s.nombre,
                'direccion', s.direccion,
                'latitud', s.latitud,
                'longitud', s.longitud,
                'telefono', s.telefono,
                'es_principal', s.es_principal
              )
            ) FILTER (WHERE s.id_sucursal IS NOT NULL),
            '[]'::json
          ) AS sucursales
        FROM establecimientos e
        LEFT JOIN sucursales s ON s.id_establecimiento = e.id_establecimiento AND s.estado = 1
        LEFT JOIN LATERAL (
          SELECT id_programa, nombre, meta_sellos, nombre_sello, imagen_sello, color_sello, puntos_por_visita
          FROM programas_sellos
          WHERE id_establecimiento = e.id_establecimiento AND estado = 'ACTIVO'
          ORDER BY id_programa DESC
          LIMIT 1
        ) ps ON true
        LEFT JOIN LATERAL (
          SELECT valor
          FROM reglas_puntos
          WHERE id_programa = ps.id_programa AND tipo_regla = 'POR_SELLO' AND estado = 1
          LIMIT 1
        ) rp ON true
        WHERE e.estado = 'ACTIVO'
      `;

      const params: any[] = [];
      if (q && String(q).trim()) {
        params.push(`%${String(q).trim()}%`);
        sql += ` AND (e.nombre_comercial ILIKE $${params.length} OR e.descripcion ILIKE $${params.length} OR s.direccion ILIKE $${params.length})`;
      }

      if (categoria && String(categoria).trim() && String(categoria) !== "Todos") {
        params.push(`%${String(categoria).trim()}%`);
        sql += ` AND (e.descripcion ILIKE $${params.length} OR e.nombre_comercial ILIKE $${params.length})`;
      }

      sql += `
        GROUP BY e.id_establecimiento, ps.id_programa, ps.nombre, ps.meta_sellos, ps.nombre_sello, ps.imagen_sello, ps.color_sello, rp.valor
        ORDER BY e.nombre_comercial ASC
      `;

      const result = await query(sql, params);
      sendResponse(res, 200, result.rows, "Establecimientos");
    } catch (error) {
      next(error);
    }
  },

  /** Listar categorías de establecimientos */
  async listarCategorias(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await query(
        `SELECT c.*, COUNT(e.id_establecimiento)::int AS total_locales
         FROM categorias_establecimiento c
         LEFT JOIN establecimientos e ON e.categoria_id = c.id
         WHERE c.estado = true
         GROUP BY c.id
         ORDER BY c.nombre ASC`,
      );
      sendResponse(res, 200, result.rows, "Categorías");
    } catch (error) {
      next(error);
    }
  },

  /** Detalle de un establecimiento específico */
  async detalle(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await query(
        `SELECT 
          e.*,
          ps.id_programa,
          ps.nombre AS programa_nombre,
          ps.meta_sellos,
          ps.nombre_sello,
          ps.imagen_sello,
          ps.color_sello,
          COALESCE(rp.valor, 20) AS puntos_por_visita
         FROM establecimientos e
         LEFT JOIN programas_sellos ps ON ps.id_establecimiento = e.id_establecimiento AND ps.estado = 'ACTIVO'
         LEFT JOIN reglas_puntos rp ON rp.id_programa = ps.id_programa AND rp.tipo_regla = 'POR_SELLO' AND rp.estado = 1
         WHERE e.id_establecimiento = $1`,
        [id],
      );

      if (!result.rows[0]) {
        throw new ApiError(404, "Establecimiento no encontrado");
      }

      const sucursales = await query(
        `SELECT * FROM sucursales WHERE id_establecimiento = $1 AND estado = 1 ORDER BY es_principal DESC`,
        [id],
      );

      const recompensas = await query(
        `SELECT * FROM recompensas WHERE id_establecimiento = $1 AND estado = 'ACTIVA' ORDER BY puntos_requeridos ASC`,
        [id],
      );

      sendResponse(res, 200, {
        ...result.rows[0],
        sucursales: sucursales.rows,
        recompensas: recompensas.rows,
      });
    } catch (error) {
      next(error);
    }
  },

  /** Estadísticas y análisis para el Panel de Comercio (Local) */
  async misStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const idUsuario = req.user!.id;

      // Obtener sucursales del usuario autenticado
      const sucRes = await query(
        `SELECT us.id_sucursal, s.nombre, s.id_establecimiento, e.nombre_comercial
         FROM usuario_sucursal us
         JOIN sucursales s ON s.id_sucursal = us.id_sucursal
         JOIN establecimientos e ON e.id_establecimiento = s.id_establecimiento
         WHERE us.id_usuario = $1 AND us.estado = 1`,
        [idUsuario],
      );

      const sucursales = sucRes.rows;
      if (sucursales.length === 0) {
        return sendResponse(res, 200, {
          establecimiento: { nombre: "Mi Local" },
          visitas_hoy: 0,
          visitas_mes: 0,
          puntos_hoy: 0,
          clientes_unicos: 0,
          visitas_ultimos_dias: [],
          ultimas_visitas: []
        });
      }

      const sucursalIds = sucursales.map((s: any) => s.id_sucursal);

      // Visitas hoy
      const visitasHoyRes = await query(
        `SELECT COUNT(*)::int AS total, (COUNT(*) * 20)::int AS puntos
         FROM visitas
         WHERE id_sucursal = ANY($1) AND estado = 'CONFIRMADA' AND DATE(fecha_hora) = CURRENT_DATE`,
        [sucursalIds],
      );

      // Visitas mes
      const visitasMesRes = await query(
        `SELECT COUNT(*)::int AS total
         FROM visitas
         WHERE id_sucursal = ANY($1) AND estado = 'CONFIRMADA'
           AND DATE_TRUNC('month', fecha_hora) = DATE_TRUNC('month', CURRENT_DATE)`,
        [sucursalIds],
      );

      // Clientes únicos
      const clientesUnicosRes = await query(
        `SELECT COUNT(DISTINCT id_cliente)::int AS total
         FROM visitas
         WHERE id_sucursal = ANY($1) AND estado = 'CONFIRMADA'`,
        [sucursalIds],
      );

      // Histórico de visitas últimos 7 días
      const tendenciaRes = await query(
        `SELECT 
           TO_CHAR(d.fecha, 'Dy') AS dia,
           TO_CHAR(d.fecha, 'YYYY-MM-DD') AS fecha,
           COUNT(v.id_visita)::int AS total
         FROM generate_series(
           CURRENT_DATE - INTERVAL '6 days',
           CURRENT_DATE,
           '1 day'::interval
         ) d(fecha)
         LEFT JOIN visitas v ON DATE(v.fecha_hora) = DATE(d.fecha) AND v.id_sucursal = ANY($1) AND v.estado = 'CONFIRMADA'
         GROUP BY d.fecha
         ORDER BY d.fecha ASC`,
        [sucursalIds],
      );

      // Últimas 5 visitas validadas en el local
      const ultimasRes = await query(
        `SELECT v.id_visita, v.fecha_hora, u.nombres, u.apellidos, u.foto_perfil, s.nombre AS sucursal_nombre
         FROM visitas v
         JOIN clientes c ON c.id_cliente = v.id_cliente
         JOIN usuarios u ON u.id_usuario = c.id_usuario
         JOIN sucursales s ON s.id_sucursal = v.id_sucursal
         WHERE v.id_sucursal = ANY($1) AND v.estado = 'CONFIRMADA'
         ORDER BY v.fecha_hora DESC
         LIMIT 6`,
        [sucursalIds],
      );

      sendResponse(res, 200, {
        establecimiento: {
          nombre: sucursales[0].nombre_comercial,
          sucursal: sucursales[0].nombre
        },
        visitas_hoy: visitasHoyRes.rows[0]?.total || 0,
        visitas_mes: visitasMesRes.rows[0]?.total || 0,
        puntos_hoy: visitasHoyRes.rows[0]?.puntos || 0,
        clientes_unicos: clientesUnicosRes.rows[0]?.total || 0,
        visitas_ultimos_dias: tendenciaRes.rows || [],
        ultimas_visitas: ultimasRes.rows || []
      });
    } catch (error) {
      next(error);
    }
  },

  /** Historial completo de visitas para el local */
  async misVisitas(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const idUsuario = req.user!.id;

      const sucRes = await query(
        `SELECT us.id_sucursal
         FROM usuario_sucursal us
         WHERE us.id_usuario = $1 AND us.estado = 1`,
        [idUsuario],
      );

      const sucursalIds = sucRes.rows.map((s: any) => s.id_sucursal);
      if (sucursalIds.length === 0) {
        return sendResponse(res, 200, []);
      }

      const result = await query(
        `SELECT v.id_visita AS id, v.fecha_hora, 20 AS puntos_ganados, 'NFC' AS metodo_validacion,
                u.nombres AS usuario_nombres, u.apellidos AS usuario_apellidos,
                u.nombres || ' ' || COALESCE(u.apellidos, '') AS cliente_nombre,
                s.nombre AS sucursal_nombre, v.observacion, v.estado
         FROM visitas v
         JOIN clientes c ON c.id_cliente = v.id_cliente
         JOIN usuarios u ON u.id_usuario = c.id_usuario
         JOIN sucursales s ON s.id_sucursal = v.id_sucursal
         WHERE v.id_sucursal = ANY($1)
         ORDER BY v.fecha_hora DESC
         LIMIT 200`,
        [sucursalIds],
      );

      sendResponse(res, 200, result.rows, "Historial de visitas del local");
    } catch (error) {
      next(error);
    }
  },

  /** Clientes exclusivos que han visitado este local */
  async misClientes(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const idUsuario = req.user!.id;

      const sucRes = await query(
        `SELECT us.id_sucursal, s.id_establecimiento
         FROM usuario_sucursal us
         JOIN sucursales s ON s.id_sucursal = us.id_sucursal
         WHERE us.id_usuario = $1 AND us.estado = 1`,
        [idUsuario],
      );

      const sucursalIds = sucRes.rows.map((s: any) => s.id_sucursal);
      const estId = sucRes.rows[0]?.id_establecimiento;
      if (sucursalIds.length === 0 || !estId) {
        return sendResponse(res, 200, []);
      }

      const result = await query(
        `SELECT 
           c.id_cliente,
           c.codigo_cliente,
           u.nombres,
           u.apellidos,
           u.foto_perfil,
           u.email,
           COUNT(DISTINCT v.id_visita)::int AS total_visitas,
           MAX(v.fecha_hora) AS ultima_visita,
           COUNT(DISTINCT s.id_sello)::int AS total_sellos,
           (COUNT(DISTINCT v.id_visita) * 20)::int AS puntos_en_local
         FROM visitas v
         JOIN clientes c ON c.id_cliente = v.id_cliente
         JOIN usuarios u ON u.id_usuario = c.id_usuario
         LEFT JOIN sellos_digitales s ON s.id_visita = v.id_visita AND s.estado = 'OTORGADO'
         WHERE v.id_sucursal = ANY($1) AND v.estado = 'CONFIRMADA'
         GROUP BY c.id_cliente, c.codigo_cliente, u.nombres, u.apellidos, u.foto_perfil, u.email
         ORDER BY ultima_visita DESC`,
        [sucursalIds],
      );

      sendResponse(res, 200, result.rows, "Clientes del local");
    } catch (error) {
      next(error);
    }
  },

  /** Recompensas activas del establecimiento */
  async misRecompensas(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const idUsuario = req.user!.id;

      const sucRes = await query(
        `SELECT s.id_establecimiento
         FROM usuario_sucursal us
         JOIN sucursales s ON s.id_sucursal = us.id_sucursal
         WHERE us.id_usuario = $1 AND us.estado = 1
         LIMIT 1`,
        [idUsuario],
      );

      const estId = sucRes.rows[0]?.id_establecimiento;
      if (!estId) {
        return sendResponse(res, 200, []);
      }

      const result = await query(
        `SELECT r.id_recompensa, r.nombre, r.descripcion, r.imagen,
                r.puntos_requeridos, r.stock, r.stock_ilimitado, r.estado,
                r.fecha_inicio, r.fecha_fin,
                (SELECT COUNT(*)::int FROM canjes c WHERE c.id_recompensa = r.id_recompensa AND c.estado IN ('CONFIRMADO', 'ENTREGADO')) AS total_canjeados
         FROM recompensas r
         WHERE r.id_establecimiento = $1
         ORDER BY r.puntos_requeridos ASC`,
        [estId],
      );

      sendResponse(res, 200, result.rows, "Recompensas del local");
    } catch (error) {
      next(error);
    }
  },

  /** Canjes solicitados en este establecimiento */
  async misCanjes(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const idUsuario = req.user!.id;
      const { estado } = req.query;

      const sucRes = await query(
        `SELECT s.id_establecimiento, us.id_sucursal
         FROM usuario_sucursal us
         JOIN sucursales s ON s.id_sucursal = us.id_sucursal
         WHERE us.id_usuario = $1 AND us.estado = 1`,
        [idUsuario],
      );

      const estId = sucRes.rows[0]?.id_establecimiento;
      if (!estId) {
        return sendResponse(res, 200, []);
      }

      let sql = `
        SELECT 
          c.id_canje AS id,
          c.codigo_canje,
          c.puntos_canje AS puntos_gastados,
          c.estado,
          c.fecha_solicitud,
          c.fecha_validacion AS fecha_entrega,
          u.nombres || ' ' || COALESCE(u.apellidos, '') AS cliente_nombre,
          u.foto_perfil AS cliente_avatar,
          u.email AS cliente_email,
          r.nombre AS recompensa_nombre,
          r.imagen AS recompensa_imagen,
          r.puntos_requeridos
        FROM canjes c
        JOIN clientes cl ON cl.id_cliente = c.id_cliente
        JOIN usuarios u ON u.id_usuario = cl.id_usuario
        JOIN recompensas r ON r.id_recompensa = c.id_recompensa
        WHERE r.id_establecimiento = $1
      `;
      const params: any[] = [estId];

      if (estado && estado !== "TODOS") {
        params.push(estado);
        sql += ` AND c.estado = $${params.length}`;
      }

      sql += ` ORDER BY c.fecha_solicitud DESC LIMIT 200`;
      const result = await query(sql, params);
      sendResponse(res, 200, result.rows, "Canjes del establecimiento");
    } catch (error) {
      next(error);
    }
  },

  /** Consultar diseño del sello propio del establecimiento del usuario comercio */
  async miSello(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const idUsuario = req.user!.id;
      // Obtener el establecimiento del usuario
      const sucRes = await query(
        `SELECT s.id_establecimiento, e.nombre_comercial, e.razon_social, e.logo
         FROM usuario_sucursal us
         JOIN sucursales s ON s.id_sucursal = us.id_sucursal
         JOIN establecimientos e ON e.id_establecimiento = s.id_establecimiento
         WHERE us.id_usuario = $1 AND us.estado = 1
         LIMIT 1`,
        [idUsuario],
      );

      if (!sucRes.rows[0]) {
        throw new ApiError(404, "No tienes una sucursal o establecimiento asignado");
      }

      const est = sucRes.rows[0];

      // Auto-crear si no existe
      await query(
        `INSERT INTO programas_sellos (
           id_establecimiento, nombre, descripcion, meta_sellos, max_sellos_visita,
           nombre_sello, imagen_sello, color_sello, estado
         ) VALUES ($1, $2, $3, 8, 1, $4, $5, '#7C0A1E', 'ACTIVO')
         ON CONFLICT DO NOTHING`,
        [
          est.id_establecimiento,
          `Pasaporte ${est.nombre_comercial}`,
          `Sellos de ${est.nombre_comercial}`,
          `Sello ${est.nombre_comercial}`,
          est.logo || '☕',
        ],
      );

      const progRes = await query(
        `SELECT 
           ps.*,
           e.nombre_comercial AS establecimiento_nombre,
           e.razon_social,
           (SELECT COUNT(*)::int FROM sellos_digitales sd WHERE sd.id_programa = ps.id_programa AND sd.estado = 'OTORGADO') AS total_sellos_otorgados
         FROM programas_sellos ps
         JOIN establecimientos e ON e.id_establecimiento = ps.id_establecimiento
         WHERE ps.id_establecimiento = $1
         ORDER BY ps.fecha_actualizacion DESC
         LIMIT 1`,
        [est.id_establecimiento],
      );

      sendResponse(res, 200, progRes.rows[0], "Diseño de sello del establecimiento");
    } catch (error) {
      next(error);
    }
  },

  /** Actualizar diseño de sello digital por parte del establecimiento */
  async actualizarMiSello(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const idUsuario = req.user!.id;
      const {
        nombre_sello,
        imagen_sello,
        color_sello,
        descripcion,
        meta_sellos,
      } = req.body;

      const sucRes = await query(
        `SELECT s.id_establecimiento, e.nombre_comercial
         FROM usuario_sucursal us
         JOIN sucursales s ON s.id_sucursal = us.id_sucursal
         JOIN establecimientos e ON e.id_establecimiento = s.id_establecimiento
         WHERE us.id_usuario = $1 AND us.estado = 1
         LIMIT 1`,
        [idUsuario],
      );

      if (!sucRes.rows[0]) {
        throw new ApiError(404, "No tienes una sucursal o establecimiento asignado");
      }

      const idEstablecimiento = sucRes.rows[0].id_establecimiento;
      const nombreComercial = sucRes.rows[0].nombre_comercial;

      const progCheck = await query(
        `SELECT id_programa FROM programas_sellos WHERE id_establecimiento = $1 LIMIT 1`,
        [idEstablecimiento],
      );

      let result;
      if (progCheck.rows[0]) {
        result = await query(
          `UPDATE programas_sellos
           SET 
             nombre_sello = COALESCE($2, nombre_sello),
             imagen_sello = COALESCE($3, imagen_sello),
             color_sello = COALESCE($4, color_sello),
             descripcion = COALESCE($5, descripcion),
             meta_sellos = CASE WHEN $6 IS NOT NULL THEN $6::int ELSE meta_sellos END,
             fecha_actualizacion = CURRENT_TIMESTAMP
           WHERE id_programa = $1
           RETURNING *`,
          [
            progCheck.rows[0].id_programa,
            nombre_sello !== undefined ? nombre_sello.trim() : null,
            imagen_sello !== undefined ? imagen_sello.trim() : null,
            color_sello !== undefined ? color_sello.trim() : null,
            descripcion !== undefined ? descripcion.trim() : null,
            meta_sellos !== undefined ? Number(meta_sellos) : null,
          ],
        );
      } else {
        result = await query(
          `INSERT INTO programas_sellos (
             id_establecimiento, nombre, descripcion, meta_sellos, max_sellos_visita,
             nombre_sello, imagen_sello, color_sello, estado, fecha_actualizacion
           ) VALUES ($1, $2, $3, $4, 1, $5, $6, $7, 'ACTIVO', CURRENT_TIMESTAMP)
           RETURNING *`,
          [
            idEstablecimiento,
            `Pasaporte ${nombreComercial}`,
            descripcion || null,
            meta_sellos ? Number(meta_sellos) : 8,
            nombre_sello || `Sello ${nombreComercial}`,
            imagen_sello || "☕",
            color_sello || "#7C0A1E",
          ],
        );
      }

      sendResponse(res, 200, result.rows[0], "Sello digital guardado exitosamente");
    } catch (error) {
      next(error);
    }
  },
};
