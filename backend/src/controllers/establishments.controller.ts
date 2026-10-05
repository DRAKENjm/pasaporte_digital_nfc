import { Response, NextFunction } from "express";
import http from "http";
import https from "https";
import { query, pool } from "../config/database";
import { ApiError, sendResponse } from "../utils";
import { AuthenticatedRequest } from "../types";

// PostgreSQL entrega BIGINT como texto; conservarlo evita perder precisión.
const isValidId = (value: unknown): boolean => {
  if (typeof value === "number") return Number.isSafeInteger(value) && value > 0;
  return typeof value === "string" && /^[1-9]\d{0,18}$/.test(value) &&
    BigInt(value) <= 9223372036854775807n;
};

/** Resuelve el establecimiento activo del usuario comercio (o lanza 404). */
const establecimientoDelUsuario = async (
  run: (sql: string, params?: any[]) => Promise<{ rows: any[] }>,
  idUsuario: number,
  idSucursal?: unknown,
) => {
  if (idSucursal != null && idSucursal !== "" && !isValidId(idSucursal)) {
    throw new ApiError(400, "Identificador de sucursal inválido");
  }
  const sucRes = await run(
    `SELECT s.id_establecimiento, e.nombre_comercial
     FROM usuario_sucursal us
     JOIN sucursales s ON s.id_sucursal = us.id_sucursal
      JOIN establecimientos e ON e.id_establecimiento = s.id_establecimiento
       WHERE us.id_usuario = $1 AND us.estado = 1 AND s.estado = 1 AND e.estado = 'ACTIVO'
         AND ($2::bigint IS NULL OR s.id_sucursal = $2)
       ORDER BY e.id_establecimiento, s.id_sucursal
       LIMIT 1
       FOR UPDATE OF e`,
    [idUsuario, idSucursal == null || idSucursal === "" ? null : idSucursal],
  );
  if (!sucRes.rows[0]) {
    throw new ApiError(404, "No tienes una sucursal o establecimiento asignado");
  }
  return sucRes.rows[0];
};

/** Valida y normaliza el cuerpo de un diseño de sello. */
const validarDiseñoSello = (body: any) => {
  const { nombre_sello, imagen_sello, color_sello, descripcion, meta_sellos } = body;
  if (typeof nombre_sello !== "string" || !nombre_sello.trim() || nombre_sello.trim().length > 100) {
    throw new ApiError(400, "El nombre del sello es obligatorio y admite hasta 100 caracteres");
  }
  if (typeof imagen_sello !== "string" || !imagen_sello.trim() || imagen_sello.trim().length > 255) {
    throw new ApiError(400, "Selecciona una insignia o una URL de imagen de hasta 255 caracteres");
  }
  if (typeof color_sello !== "string" || !/^#[0-9a-f]{6}$/i.test(color_sello)) {
    throw new ApiError(400, "El color debe tener formato hexadecimal, por ejemplo #7C0A1E");
  }
  if (typeof descripcion !== "string" || descripcion.trim().length > 255) {
    throw new ApiError(400, "La descripción admite hasta 255 caracteres");
  }
  if (!Number.isInteger(meta_sellos) || meta_sellos < 4 || meta_sellos > 20) {
    throw new ApiError(400, "La meta debe ser un número entero entre 4 y 20 sellos");
  }
  return {
    nombre: nombre_sello.trim(),
    imagen: imagen_sello.trim(),
    color: color_sello.trim(),
    descripcion: descripcion.trim(),
    meta: meta_sellos,
  };
};

export const EstablishmentsController = {
  /** Sucursales activas asignadas al trabajador para validar visitas. */
  async misSucursales(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await query(
        `SELECT s.id_sucursal, s.nombre, s.direccion, s.telefono, s.horario, s.google_maps_url,
                e.id_establecimiento, e.nombre_comercial, e.razon_social, e.ruc,
                e.email, e.telefono AS telefono_establecimiento,
                e.logo, e.imagen_portada, e.descripcion,
                COALESCE(e.monto_por_punto, 10) AS monto_por_punto,
                cat.icono_url AS categoria_icono, cat.nombre AS categoria_nombre,
                ps.id_programa, ps.nombre AS programa_nombre, ps.meta_sellos,
                CASE WHEN ps.id_programa IS NOT NULL
                  THEN COALESCE(ps.puntos_por_visita, rp.valor, 20)
                END AS puntos_por_visita
         FROM sucursales s
         JOIN establecimientos e ON e.id_establecimiento = s.id_establecimiento
         LEFT JOIN categorias_establecimiento cat ON cat.id = e.categoria_id
         LEFT JOIN LATERAL (
           SELECT id_programa, nombre, meta_sellos, puntos_por_visita
           FROM programas_sellos
           WHERE id_establecimiento = e.id_establecimiento AND estado = 'ACTIVO'
           ORDER BY id_programa DESC LIMIT 1
         ) ps ON true
         LEFT JOIN LATERAL (
           SELECT valor FROM reglas_puntos
           WHERE id_programa = ps.id_programa AND tipo_regla = 'POR_SELLO' AND estado = 1
           LIMIT 1
         ) rp ON true
         WHERE s.estado = 1 AND e.estado = 'ACTIVO'
           AND EXISTS (
             SELECT 1 FROM usuario_sucursal us
             WHERE us.id_sucursal = s.id_sucursal AND us.id_usuario = $1 AND us.estado = 1
           )
         ORDER BY e.nombre_comercial, s.nombre, s.id_sucursal`,
        [req.user!.id],
      );
      sendResponse(res, 200, result.rows, "Sucursales asignadas");
    } catch (error) {
      next(error);
    }
  },

  /** Actualizar perfil del establecimiento por el comercio asignado (imágenes, teléfono, etc.) */
  async actualizarMiPerfil(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const idUsuario = req.user!.id;
      const { logo, imagen_portada, telefono, email, descripcion, horario, id_sucursal, google_maps_url, direccion, monto_por_punto, puntos_por_sello } = req.body;

      // Obtener el establecimiento del usuario
      const sucRes = await query(
        `SELECT s.id_establecimiento, s.id_sucursal
         FROM usuario_sucursal us
         JOIN sucursales s ON s.id_sucursal = us.id_sucursal
         JOIN establecimientos e ON e.id_establecimiento = s.id_establecimiento
         WHERE us.id_usuario = $1 AND us.estado = 1 AND s.estado = 1 AND e.estado = 'ACTIVO'
           AND ($2::bigint IS NULL OR s.id_sucursal = $2)
         ORDER BY s.es_principal DESC, s.id_sucursal ASC
         LIMIT 1`,
        [idUsuario, id_sucursal ? Number(id_sucursal) : null],
      );
      if (!sucRes.rows[0]) {
        throw new ApiError(404, "No tienes un establecimiento asignado");
      }
      const idEst = sucRes.rows[0].id_establecimiento;
      const idSucTarget = sucRes.rows[0].id_sucursal;

      const hasMontoPorPunto = monto_por_punto !== undefined && !isNaN(Number(monto_por_punto)) && Number(monto_por_punto) > 0;
      const montoPorPuntoVal = hasMontoPorPunto ? Number(monto_por_punto) : null;

      const updateRes = await query(
        `UPDATE establecimientos
         SET logo = COALESCE($1, logo),
             imagen_portada = COALESCE($2, imagen_portada),
             telefono = COALESCE($3, telefono),
             email = COALESCE($4, email),
             descripcion = COALESCE($5, descripcion),
             monto_por_punto = CASE WHEN $7::boolean THEN $8::numeric ELSE monto_por_punto END
         WHERE id_establecimiento = $6
         RETURNING id_establecimiento, nombre_comercial, logo, imagen_portada, telefono, email, descripcion, monto_por_punto`,
        [
          logo !== undefined ? (logo || null) : null,
          imagen_portada !== undefined ? (imagen_portada || null) : null,
          telefono !== undefined ? (telefono || null) : null,
          email !== undefined ? (email || null) : null,
          descripcion !== undefined ? (descripcion || null) : null,
          idEst,
          hasMontoPorPunto,
          montoPorPuntoVal,
        ],
      );

      // Si se configuraron puntos por sello, actualizar programas_sellos y reglas_sellos
      if (puntos_por_sello !== undefined && !isNaN(Number(puntos_por_sello)) && Number(puntos_por_sello) > 0) {
        const ptsSelloVal = Math.floor(Number(puntos_por_sello));
        await query(
          `UPDATE programas_sellos 
           SET puntos_por_visita = $1, fecha_actualizacion = CURRENT_TIMESTAMP 
           WHERE id_establecimiento = $2`,
          [ptsSelloVal, idEst],
        );
        await query(
          `UPDATE reglas_sellos 
           SET valor_puntos_por_sello = $1 
           WHERE establecimiento_id = $2`,
          [ptsSelloVal, idEst],
        );
      }

      // Si se proporcionó horario, dirección o enlace de Google Maps, actualizar la sucursal asignada
      if (horario !== undefined || direccion !== undefined || google_maps_url !== undefined) {
        let latVal: number | null = null;
        let lngVal: number | null = null;

        if (google_maps_url && typeof google_maps_url === "string" && google_maps_url.trim()) {
          let targetUrl = google_maps_url.trim();
          if (targetUrl.includes("maps.app.goo.gl") || targetUrl.includes("goo.gl/maps")) {
            try {
              const redirectUrl = await new Promise<string | null>((resolve) => {
                const client = targetUrl.startsWith("https:") ? https : http;
                const reqHttp = client.get(targetUrl, { timeout: 4000 }, (res) => {
                  resolve(res.headers.location || null);
                });
                reqHttp.on("error", () => resolve(null));
                reqHttp.on("timeout", () => {
                  reqHttp.destroy();
                  resolve(null);
                });
              });
              if (redirectUrl) targetUrl = redirectUrl;
            } catch {}
          }

          const pinMatch = targetUrl.match(/!3d(-?\d+\.?\d+)!4d(-?\d+\.?\d+)/);
          if (pinMatch) {
            latVal = parseFloat(pinMatch[1]);
            lngVal = parseFloat(pinMatch[2]);
          } else {
            const destMatch = targetUrl.match(/destination=(-?\d+\.?\d+),(-?\d+\.?\d+)/);
            if (destMatch) {
              latVal = parseFloat(destMatch[1]);
              lngVal = parseFloat(destMatch[2]);
            } else {
              const dirMatch = targetUrl.match(/!2d(-?\d+\.?\d+)!2d(-?\d+\.?\d+)/);
              if (dirMatch) {
                lngVal = parseFloat(dirMatch[1]);
                latVal = parseFloat(dirMatch[2]);
              } else {
                const patterns = [
                  /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
                  /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
                  /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
                  /(-?\d+\.?\d+),\s*(-?\d+\.?\d+)/,
                ];
                for (const pat of patterns) {
                  const m = targetUrl.match(pat);
                  if (m) {
                    latVal = parseFloat(m[1]);
                    lngVal = parseFloat(m[2]);
                    break;
                  }
                }
              }
            }
          }
        }

        await query(
          `UPDATE sucursales
           SET horario = CASE WHEN $1::boolean THEN $2 ELSE horario END,
               direccion = CASE WHEN $3::boolean THEN $4 ELSE direccion END,
               google_maps_url = CASE WHEN $5::boolean THEN $6 ELSE google_maps_url END,
               latitud = CASE WHEN $7::numeric IS NOT NULL THEN $7::numeric ELSE latitud END,
               longitud = CASE WHEN $8::numeric IS NOT NULL THEN $8::numeric ELSE longitud END
           WHERE id_sucursal = $9`,
          [
            horario !== undefined,
            horario ? String(horario).trim() : null,
            direccion !== undefined,
            direccion ? String(direccion).trim() : null,
            google_maps_url !== undefined,
            google_maps_url ? String(google_maps_url).trim() : null,
            latVal,
            lngVal,
            idSucTarget,
          ],
        );
      }

      sendResponse(res, 200, { ...updateRes.rows[0], horario, direccion, google_maps_url }, "Perfil del establecimiento actualizado exitosamente");
    } catch (error) {
      next(error);
    }
  },

  /** Listar establecimientos y sus sucursales (para la pantalla Explorar) */
  async listar(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { q, categoria } = req.query;

      let sql = `
        SELECT 
          e.id_establecimiento,
          e.nombre_comercial,
          e.categoria_id,
          cat.nombre AS categoria_nombre,
          cat.icono_url AS categoria_icono,
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
          COALESCE(ps.nombre_sello, 'Sello ' || e.nombre_comercial) AS nombre_sello,
          COALESCE(ps.imagen_sello, cat.icono_url, e.logo, 'landmark') AS imagen_sello,
          COALESCE(ps.color_sello, '#7C0A1E') AS color_sello,
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
                'es_principal', s.es_principal,
                'permite_autosellado', COALESCE(s.permite_autosellado, 0),
                'radio_tolerancia_metros', COALESCE(s.radio_tolerancia_metros, 150),
                'requiere_foto', COALESCE(s.requiere_foto, 0)
              )
            ) FILTER (WHERE s.id_sucursal IS NOT NULL),
            '[]'::json
          ) AS sucursales
        FROM establecimientos e
        LEFT JOIN categorias_establecimiento cat ON cat.id = e.categoria_id
        LEFT JOIN sucursales s ON s.id_establecimiento = e.id_establecimiento AND s.estado = 1
        LEFT JOIN LATERAL (
          SELECT id_programa, nombre, meta_sellos, nombre_sello, imagen_sello, color_sello, puntos_por_visita
          FROM programas_sellos
          WHERE id_establecimiento = e.id_establecimiento
          ORDER BY (CASE WHEN estado = 'ACTIVO' THEN 1 ELSE 0 END) DESC, fecha_actualizacion DESC, id_programa DESC
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
        params.push(String(categoria).trim());
        sql += ` AND cat.nombre = $${params.length}`;
      }

      sql += `
        GROUP BY e.id_establecimiento, cat.nombre, cat.icono_url, ps.id_programa, ps.nombre, ps.meta_sellos, ps.nombre_sello, ps.imagen_sello, ps.color_sello, rp.valor
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
          cat.nombre AS categoria_nombre,
          cat.icono_url AS categoria_icono,
          ps.id_programa,
          ps.nombre AS programa_nombre,
          ps.meta_sellos,
          COALESCE(ps.nombre_sello, 'Sello ' || e.nombre_comercial) AS nombre_sello,
          COALESCE(ps.imagen_sello, cat.icono_url, e.logo, 'landmark') AS imagen_sello,
          COALESCE(ps.color_sello, '#7C0A1E') AS color_sello,
          COALESCE(rp.valor, ps.puntos_por_visita, 20) AS puntos_por_visita
         FROM establecimientos e
         LEFT JOIN categorias_establecimiento cat ON cat.id = e.categoria_id
         LEFT JOIN LATERAL (
           SELECT id_programa, nombre, meta_sellos, nombre_sello, imagen_sello, color_sello, puntos_por_visita
           FROM programas_sellos
           WHERE id_establecimiento = e.id_establecimiento
           ORDER BY (CASE WHEN estado = 'ACTIVO' THEN 1 ELSE 0 END) DESC, fecha_actualizacion DESC, id_programa DESC
           LIMIT 1
         ) ps ON true
         LEFT JOIN LATERAL (
           SELECT valor
           FROM reglas_puntos
           WHERE id_programa = ps.id_programa AND tipo_regla = 'POR_SELLO' AND estado = 1
           LIMIT 1
         ) rp ON true
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
        `SELECT id_recompensa, id_establecimiento, nombre, descripcion, imagen, imagen AS imagen_url, puntos_requeridos, stock, stock_ilimitado, estado FROM recompensas WHERE id_establecimiento = $1 AND estado = 'ACTIVA' ORDER BY puntos_requeridos ASC`,
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
        `SELECT us.id_sucursal, s.nombre, s.id_establecimiento, e.nombre_comercial,
                e.logo, cat.icono_url AS categoria_icono, cat.nombre AS categoria_nombre
         FROM usuario_sucursal us
         JOIN sucursales s ON s.id_sucursal = us.id_sucursal
         JOIN establecimientos e ON e.id_establecimiento = s.id_establecimiento
         LEFT JOIN categorias_establecimiento cat ON cat.id = e.categoria_id
         WHERE us.id_usuario = $1 AND us.estado = 1`,
        [idUsuario],
      );

      const sucursales = sucRes.rows;
      if (sucursales.length === 0) {
        return sendResponse(res, 200, {
          establecimiento: {
            id_establecimiento: null,
            nombre: "Mi Local",
            sucursal: "Principal",
            logo: null,
            categoria_icono: "store",
            categoria_nombre: "Comercio"
          },
          visitas_hoy: 0,
          visitas_mes: 0,
          puntos_hoy: 0,
          clientes_unicos: 0,
          puntos_mes: 0,
          visitas_por_dia: [],
          visitas_por_hora: [],
          recurrencia_clientes: { una_visita: 0, dos_a_cuatro: 0, cinco_o_mas: 0 },
          visitas_ultimos_dias: [],
          ultimas_visitas: []
        });
      }

      const sucursalIds = sucursales.map((s: any) => s.id_sucursal);

      // Visitas hoy
      const visitasHoyRes = await query(
        `SELECT COUNT(DISTINCT v.id_visita)::int AS total,
                COALESCE(SUM(sd.puntos_sello_snapshot * sd.cantidad), 0)::int AS puntos
         FROM visitas v
         LEFT JOIN sellos_digitales sd ON sd.id_visita = v.id_visita AND sd.estado = 'OTORGADO'
         WHERE v.id_sucursal = ANY($1) AND v.estado = 'CONFIRMADA' AND DATE(v.fecha_hora) = CURRENT_DATE`,
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

      // Clientes únicos durante el mes, comparable con visitas_mes.
      const clientesUnicosRes = await query(
        `SELECT COUNT(DISTINCT id_cliente)::int AS total
         FROM visitas
         WHERE id_sucursal = ANY($1) AND estado = 'CONFIRMADA'
           AND DATE_TRUNC('month', fecha_hora) = DATE_TRUNC('month', CURRENT_DATE)`,
        [sucursalIds],
      );

      const puntosMesRes = await query(
        `SELECT COALESCE(SUM(sd.puntos_sello_snapshot * sd.cantidad), 0)::int AS total
         FROM visitas v
         JOIN sellos_digitales sd ON sd.id_visita = v.id_visita AND sd.estado = 'OTORGADO'
         WHERE v.id_sucursal = ANY($1) AND v.estado = 'CONFIRMADA'
           AND DATE_TRUNC('month', v.fecha_hora) = DATE_TRUNC('month', CURRENT_DATE)`,
        [sucursalIds],
      );

      const visitasPorDiaRes = await query(
        `SELECT EXTRACT(DOW FROM fecha_hora)::int AS dia_semana, COUNT(*)::int AS total
         FROM visitas
         WHERE id_sucursal = ANY($1) AND estado = 'CONFIRMADA'
         GROUP BY EXTRACT(DOW FROM fecha_hora)
         ORDER BY dia_semana`,
        [sucursalIds],
      );

      const visitasPorHoraRes = await query(
        `SELECT CASE
                  WHEN EXTRACT(HOUR FROM fecha_hora) BETWEEN 8 AND 10 THEN 'manana'
                  WHEN EXTRACT(HOUR FROM fecha_hora) BETWEEN 11 AND 14 THEN 'mediodia'
                  WHEN EXTRACT(HOUR FROM fecha_hora) BETWEEN 15 AND 18 THEN 'tarde'
                  WHEN EXTRACT(HOUR FROM fecha_hora) BETWEEN 19 AND 21 THEN 'noche'
                  ELSE 'otros'
                END AS franja,
                COUNT(*)::int AS total
         FROM visitas
         WHERE id_sucursal = ANY($1) AND estado = 'CONFIRMADA'
         GROUP BY franja`,
        [sucursalIds],
      );

      const recurrenciaRes = await query(
        `SELECT COUNT(*) FILTER (WHERE visitas_cliente = 1)::int AS una_visita,
                COUNT(*) FILTER (WHERE visitas_cliente BETWEEN 2 AND 4)::int AS dos_a_cuatro,
                COUNT(*) FILTER (WHERE visitas_cliente >= 5)::int AS cinco_o_mas
         FROM (
           SELECT id_cliente, COUNT(*) AS visitas_cliente
           FROM visitas
           WHERE id_sucursal = ANY($1) AND estado = 'CONFIRMADA'
             AND DATE_TRUNC('month', fecha_hora) = DATE_TRUNC('month', CURRENT_DATE)
           GROUP BY id_cliente
         ) clientes_mes`,
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
        `SELECT v.id_visita, v.fecha_hora, u.nombres, u.apellidos, u.foto_perfil,
                s.nombre AS sucursal_nombre,
                COALESCE(sellos.cantidad, 0)::int AS sellos_otorgados,
                COALESCE(sellos.puntos, 0)::int AS puntos_otorgados
         FROM visitas v
         JOIN clientes c ON c.id_cliente = v.id_cliente
         JOIN usuarios u ON u.id_usuario = c.id_usuario
         JOIN sucursales s ON s.id_sucursal = v.id_sucursal
         LEFT JOIN LATERAL (
           SELECT SUM(sd.cantidad) AS cantidad,
                  SUM(sd.puntos_sello_snapshot * sd.cantidad) AS puntos
           FROM sellos_digitales sd
           WHERE sd.id_visita = v.id_visita AND sd.estado = 'OTORGADO'
         ) sellos ON true
         WHERE v.id_sucursal = ANY($1) AND v.estado = 'CONFIRMADA'
         ORDER BY v.fecha_hora DESC
         LIMIT 6`,
        [sucursalIds],
      );

      sendResponse(res, 200, {
        establecimiento: {
          id_establecimiento: sucursales[0].id_establecimiento,
          nombre: sucursales[0].nombre_comercial,
          sucursal: sucursales[0].nombre,
          logo: sucursales[0].logo,
          categoria_icono: sucursales[0].categoria_icono,
          categoria_nombre: sucursales[0].categoria_nombre
        },
        visitas_hoy: visitasHoyRes.rows[0]?.total || 0,
        visitas_mes: visitasMesRes.rows[0]?.total || 0,
        puntos_hoy: visitasHoyRes.rows[0]?.puntos || 0,
        clientes_unicos: clientesUnicosRes.rows[0]?.total || 0,
        puntos_mes: puntosMesRes.rows[0]?.total || 0,
        visitas_por_dia: visitasPorDiaRes.rows || [],
        visitas_por_hora: visitasPorHoraRes.rows || [],
        recurrencia_clientes: recurrenciaRes.rows[0] || { una_visita: 0, dos_a_cuatro: 0, cinco_o_mas: 0 },
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
        `SELECT r.id_recompensa, r.nombre, r.descripcion, r.imagen, r.imagen AS imagen_url,
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
      if (req.query?.id_sucursal != null && !isValidId(req.query.id_sucursal)) {
        throw new ApiError(400, "Identificador de sucursal inválido");
      }
      // Obtener el establecimiento del usuario
      const sucRes = await query(
        `SELECT s.id_establecimiento, e.nombre_comercial, e.razon_social, e.logo
         FROM usuario_sucursal us
         JOIN sucursales s ON s.id_sucursal = us.id_sucursal
          JOIN establecimientos e ON e.id_establecimiento = s.id_establecimiento
           WHERE us.id_usuario = $1 AND us.estado = 1 AND s.estado = 1 AND e.estado = 'ACTIVO'
             AND ($2::bigint IS NULL OR s.id_sucursal = $2)
          ORDER BY e.id_establecimiento, s.id_sucursal
          LIMIT 1`,
        [idUsuario, req.query?.id_sucursal ?? null],
      );

      if (!sucRes.rows[0]) {
        throw new ApiError(404, "No tienes una sucursal o establecimiento asignado");
      }

      const est = sucRes.rows[0];

      const progRes = await query(
        `SELECT 
           ps.*,
            e.nombre_comercial AS establecimiento_nombre,
            e.razon_social,
            COALESCE((to_jsonb(ps)->>'puntos_por_visita')::numeric,
              (SELECT rp.valor FROM reglas_puntos rp WHERE rp.id_programa = ps.id_programa
               AND rp.tipo_regla = 'POR_SELLO' AND rp.estado = 1 LIMIT 1), 20) AS puntos_por_visita,
           (SELECT COUNT(*)::int FROM sellos_digitales sd WHERE sd.id_programa = ps.id_programa AND sd.estado = 'OTORGADO') AS total_sellos_otorgados
         FROM programas_sellos ps
         JOIN establecimientos e ON e.id_establecimiento = ps.id_establecimiento
          WHERE ps.id_establecimiento = $1 AND ps.estado = 'ACTIVO'
           ORDER BY ps.fecha_actualizacion DESC, ps.id_programa DESC
         LIMIT 1`,
        [est.id_establecimiento],
      );

      // Consultar nunca crea registros. Un diseño inicial se persiste al guardar.
      sendResponse(res, 200, progRes.rows[0] || {
        id_programa: null,
        establecimiento_nombre: est.nombre_comercial,
        razon_social: est.razon_social,
        nombre_sello: `Sello ${est.nombre_comercial}`.slice(0, 100),
        imagen_sello: est.logo || "☕",
        color_sello: "#7C0A1E",
        descripcion: `Sellos de ${est.nombre_comercial}`.slice(0, 255),
        meta_sellos: 8,
        puntos_por_visita: 20,
        total_sellos_otorgados: 0,
      }, "Diseño de sello del establecimiento");
    } catch (error) {
      next(error);
    }
  },

  /** Actualizar diseño de sello digital por parte del establecimiento */
  async actualizarMiSello(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    let client: any;
    try {
      const idUsuario = req.user!.id;
      const {
        nombre_sello,
        imagen_sello,
        color_sello,
        descripcion,
        meta_sellos,
      } = req.body;

      if (typeof nombre_sello !== "string" || !nombre_sello.trim() || nombre_sello.trim().length > 100) {
        throw new ApiError(400, "El nombre del sello es obligatorio y admite hasta 100 caracteres");
      }
      if (typeof imagen_sello !== "string" || !imagen_sello.trim() || imagen_sello.trim().length > 255) {
        throw new ApiError(400, "Selecciona una insignia o una URL de imagen de hasta 255 caracteres");
      }
      if (typeof color_sello !== "string" || !/^#[0-9a-f]{6}$/i.test(color_sello)) {
        throw new ApiError(400, "El color debe tener formato hexadecimal, por ejemplo #7C0A1E");
      }
      if (typeof descripcion !== "string" || descripcion.trim().length > 255) {
        throw new ApiError(400, "La descripción admite hasta 255 caracteres");
      }
      if (!Number.isInteger(meta_sellos) || meta_sellos < 4 || meta_sellos > 20) {
        throw new ApiError(400, "La meta debe ser un número entero entre 4 y 20 sellos");
      }

      client = await pool.connect();
      await client.query("BEGIN");
      const sucRes = await client.query(
        `SELECT s.id_establecimiento, e.nombre_comercial
         FROM usuario_sucursal us
         JOIN sucursales s ON s.id_sucursal = us.id_sucursal
          JOIN establecimientos e ON e.id_establecimiento = s.id_establecimiento
          WHERE us.id_usuario = $1 AND us.estado = 1 AND s.estado = 1 AND e.estado = 'ACTIVO'
          ORDER BY e.id_establecimiento, s.id_sucursal
          LIMIT 1
          FOR UPDATE OF e`,
        [idUsuario],
      );

      if (!sucRes.rows[0]) {
        throw new ApiError(404, "No tienes una sucursal o establecimiento asignado");
      }

      const idEstablecimiento = sucRes.rows[0].id_establecimiento;
      const nombreComercial = sucRes.rows[0].nombre_comercial;

      const progCheck = await client.query(
        `SELECT id_programa, meta_sellos FROM programas_sellos
         WHERE id_establecimiento = $1 AND estado = 'ACTIVO'
         ORDER BY id_programa DESC LIMIT 1
         FOR UPDATE`,
        [idEstablecimiento],
      );

      let result;
      if (progCheck.rows[0]) {
        const historialMeta = await client.query(
          `SELECT ps.meta_sellos,
                  EXISTS (SELECT 1 FROM sellos_digitales sd
                          WHERE sd.id_programa = ps.id_programa AND sd.estado = 'OTORGADO') AS tiene_sellos
           FROM programas_sellos ps WHERE ps.id_programa = $1`,
          [progCheck.rows[0].id_programa],
        );
        if (historialMeta.rows[0]?.tiene_sellos && Number(historialMeta.rows[0].meta_sellos) !== meta_sellos) {
          throw new ApiError(409, "Este diseño ya tiene sellos otorgados. Crea un nuevo diseño para cambiar la meta y conservar el historial.");
        }
        result = await client.query(
          `UPDATE programas_sellos
           SET 
              nombre_sello = $2,
              imagen_sello = $3,
              color_sello = $4,
              descripcion = $5,
              meta_sellos = $6::int,
             fecha_actualizacion = CURRENT_TIMESTAMP
           WHERE id_programa = $1
           RETURNING *`,
          [
            progCheck.rows[0].id_programa,
            nombre_sello.trim(),
            imagen_sello.trim(),
            color_sello,
            descripcion.trim(),
            meta_sellos,
          ],
        );
      } else {
        result = await client.query(
          `INSERT INTO programas_sellos (
             id_establecimiento, nombre, descripcion, meta_sellos, max_sellos_visita,
              nombre_sello, imagen_sello, color_sello, estado, fecha_inicio, fecha_actualizacion
            ) VALUES ($1, $2, $3, $4, 1, $5, $6, $7, 'ACTIVO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           RETURNING *`,
          [
            idEstablecimiento,
            `Pasaporte ${nombreComercial}`.slice(0, 120),
            descripcion.trim(),
            meta_sellos,
            nombre_sello.trim(),
            imagen_sello.trim(),
            color_sello,
          ],
        );
      }

      await client.query("COMMIT");
      sendResponse(res, 200, result.rows[0], "Sello digital guardado exitosamente");
    } catch (error) {
      if (client) await client.query("ROLLBACK");
      next(error);
    } finally {
      client?.release();
    }
  },

  /** Listar todos los diseños de sello del establecimiento (activos e inactivos) */
  async misSellos(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const est = await establecimientoDelUsuario(query, req.user!.id, req.query?.id_sucursal);
      const result = await query(
        `SELECT ps.id_programa, ps.nombre_sello, ps.imagen_sello, ps.color_sello,
                ps.descripcion, ps.meta_sellos, ps.estado, ps.fecha_actualizacion,
                e.nombre_comercial AS establecimiento_nombre,
                COALESCE(ps.puntos_por_visita,
                  (SELECT rp.valor FROM reglas_puntos rp
                   WHERE rp.id_programa = ps.id_programa AND rp.tipo_regla = 'POR_SELLO' AND rp.estado = 1
                   LIMIT 1), 20) AS puntos_por_visita,
                (SELECT COUNT(*)::int FROM sellos_digitales sd
                  WHERE sd.id_programa = ps.id_programa AND sd.estado = 'OTORGADO') AS total_sellos_otorgados
         FROM programas_sellos ps
         JOIN establecimientos e ON e.id_establecimiento = ps.id_establecimiento
         WHERE ps.id_establecimiento = $1
         ORDER BY (ps.estado = 'ACTIVO') DESC, ps.fecha_actualizacion DESC, ps.id_programa DESC`,
        [est.id_establecimiento],
      );
      sendResponse(res, 200, result.rows, "Diseños de sello del establecimiento");
    } catch (error) {
      next(error);
    }
  },

  async listarFavoritos(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const idUsuario = req.user!.id;
      const cliente = await query(`SELECT id_cliente FROM clientes WHERE id_usuario = $1`, [idUsuario]);
      const idCliente = cliente.rows[0]?.id_cliente;
      if (!idCliente) {
        sendResponse(res, 200, []);
        return;
      }
      const result = await query(
        `SELECT e.id_establecimiento, e.nombre_comercial, e.logo, e.descripcion, e.imagen_portada,
                f.fecha_agregado
         FROM locales_favoritos f
         JOIN establecimientos e ON e.id_establecimiento = f.id_establecimiento
         WHERE f.id_cliente = $1 AND e.estado = 'ACTIVO'
         ORDER BY f.fecha_agregado DESC`,
        [idCliente],
      );
      sendResponse(res, 200, result.rows);
    } catch (error) {
      next(error);
    }
  },

  async toggleFavorito(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const idUsuario = req.user!.id;
      const idEst = Number(req.params.id);
      const cliente = await query(`SELECT id_cliente FROM clientes WHERE id_usuario = $1`, [idUsuario]);
      const idCliente = cliente.rows[0]?.id_cliente;
      if (!idCliente) throw new ApiError(400, "Cliente no encontrado");

      const exists = await query(
        `SELECT id_favorito FROM locales_favoritos WHERE id_cliente = $1 AND id_establecimiento = $2`,
        [idCliente, idEst],
      );
      if (exists.rows[0]) {
        await query(`DELETE FROM locales_favoritos WHERE id_favorito = $1`, [exists.rows[0].id_favorito]);
        sendResponse(res, 200, { favorito: false });
        return;
      }
      await query(
        `INSERT INTO locales_favoritos (id_cliente, id_establecimiento) VALUES ($1, $2)`,
        [idCliente, idEst],
      );
      sendResponse(res, 200, { favorito: true });
    } catch (error) {
      next(error);
    }
  },

  /** Crear un nuevo diseño de sello (queda ACTIVO y disponible para visitas) */
  async crearMiSello(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    let client: any;
    try {
      const d = validarDiseñoSello(req.body);
      client = await pool.connect();
      await client.query("BEGIN");
      const est = await establecimientoDelUsuario(
        (sql, params) => client.query(sql, params),
        req.user!.id,
        req.body?.id_sucursal,
      );
      const result = await client.query(
        `INSERT INTO programas_sellos (
           id_establecimiento, nombre, descripcion, meta_sellos, max_sellos_visita,
           nombre_sello, imagen_sello, color_sello, estado, fecha_inicio, fecha_actualizacion
         ) VALUES ($1, $2, $3, $4, 1, $5, $6, $7, 'ACTIVO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          est.id_establecimiento,
          d.nombre.slice(0, 120),
          d.descripcion,
          d.meta,
          d.nombre,
          d.imagen,
          d.color,
        ],
      );
      await client.query("COMMIT");
      sendResponse(res, 201, result.rows[0], "Nuevo diseño de sello creado");
    } catch (error) {
      if (client) await client.query("ROLLBACK");
      next(error);
    } finally {
      client?.release();
    }
  },

  /** Editar un diseño de sello existente del propio establecimiento */
  async actualizarMiSelloDiseño(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    let client: any;
    try {
      const idPrograma = req.params.id;
      if (!isValidId(idPrograma)) throw new ApiError(400, "Identificador de sello inválido");
      const d = validarDiseñoSello(req.body);
      client = await pool.connect();
      await client.query("BEGIN");
      const est = await establecimientoDelUsuario(
        (sql, params) => client.query(sql, params),
        req.user!.id,
        req.query?.id_sucursal,
      );
      const check = await client.query(
        `SELECT id_programa, meta_sellos FROM programas_sellos
         WHERE id_programa = $1 AND id_establecimiento = $2
         FOR UPDATE`,
        [idPrograma, est.id_establecimiento],
      );
      if (!check.rows[0]) throw new ApiError(404, "Diseño de sello no encontrado");
      if (Number(check.rows[0].meta_sellos) !== d.meta) {
        const tieneSellos = await client.query(
          `SELECT EXISTS (SELECT 1 FROM sellos_digitales
                          WHERE id_programa = $1 AND estado = 'OTORGADO') AS tiene_sellos`,
          [idPrograma],
        );
        if (tieneSellos.rows[0]?.tiene_sellos) {
          throw new ApiError(409, "Este diseño ya tiene sellos otorgados. Crea un nuevo diseño para cambiar la meta y conservar el historial.");
        }
      }
      const result = await client.query(
        `UPDATE programas_sellos
         SET nombre_sello = $2,
             imagen_sello = $3,
             color_sello = $4,
             descripcion = $5,
             meta_sellos = $6::int,
             fecha_actualizacion = CURRENT_TIMESTAMP
         WHERE id_programa = $1
         RETURNING *`,
        [idPrograma, d.nombre, d.imagen, d.color, d.descripcion, d.meta],
      );
      await client.query("COMMIT");
      sendResponse(res, 200, result.rows[0], "Diseño de sello actualizado");
    } catch (error) {
      if (client) await client.query("ROLLBACK");
      next(error);
    } finally {
      client?.release();
    }
  },

  /** Activar o desactivar un diseño (nunca se borra: preserva el historial) */
  async cambiarEstadoMiSello(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    let client: any;
    try {
      const idPrograma = req.params.id;
      if (!isValidId(idPrograma)) throw new ApiError(400, "Identificador de sello inválido");
      const { estado } = req.body;
      if (estado !== "ACTIVO" && estado !== "INACTIVO") {
        throw new ApiError(400, "El estado debe ser ACTIVO o INACTIVO");
      }
      client = await pool.connect();
      await client.query("BEGIN");
      const est = await establecimientoDelUsuario(
        (sql, params) => client.query(sql, params),
        req.user!.id,
        req.query?.id_sucursal,
      );
      const check = await client.query(
        `SELECT id_programa, estado FROM programas_sellos
         WHERE id_programa = $1 AND id_establecimiento = $2
         FOR UPDATE`,
        [idPrograma, est.id_establecimiento],
      );
      if (!check.rows[0]) throw new ApiError(404, "Diseño de sello no encontrado");

      if (estado === "INACTIVO" && check.rows[0].estado === "ACTIVO") {
        const activos = await client.query(
          `SELECT COUNT(*)::int AS n FROM programas_sellos
           WHERE id_establecimiento = $1 AND estado = 'ACTIVO'`,
          [est.id_establecimiento],
        );
        if (activos.rows[0].n <= 1) {
          throw new ApiError(400, "Debe haber al menos un sello activo para poder validar visitas");
        }
      }

      const result = await client.query(
        `UPDATE programas_sellos
         SET estado = $2, fecha_actualizacion = CURRENT_TIMESTAMP
         WHERE id_programa = $1
         RETURNING *`,
        [idPrograma, estado],
      );
      await client.query("COMMIT");
      sendResponse(res, 200, result.rows[0],
        estado === "ACTIVO" ? "Sello activado" : "Sello desactivado");
    } catch (error) {
      if (client) await client.query("ROLLBACK");
      next(error);
    } finally {
      client?.release();
    }
  },

  /** Listar la biblioteca reutilizable de insignias personalizadas del local */
  async misInsignias(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const est = await establecimientoDelUsuario(query, req.user!.id, req.query?.id_sucursal);
      const result = await query(
        `SELECT id_insignia, nombre, imagen_url, estado, fecha_creacion
         FROM insignias_sello
         WHERE id_establecimiento = $1
         ORDER BY (estado = 'ACTIVO') DESC, fecha_creacion DESC, id_insignia DESC`,
        [est.id_establecimiento],
      );
      sendResponse(res, 200, result.rows, "Biblioteca de insignias del establecimiento");
    } catch (error) {
      next(error);
    }
  },

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    return this.detalle(req, res, next);
  },
  /** Guardar una insignia personalizada para reutilizarla en varios diseños */
  async crearMiInsignia(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    let client: any;
    try {
      const { nombre, imagen_url } = req.body;
      if (typeof nombre !== "string" || !nombre.trim() || nombre.trim().length > 80) {
        throw new ApiError(400, "El nombre de la insignia es obligatorio y admite hasta 80 caracteres");
      }
      if (typeof imagen_url !== "string" || !/^https?:\/\/\S+$/i.test(imagen_url.trim()) || imagen_url.trim().length > 255) {
        throw new ApiError(400, "Sube una imagen válida para la insignia (máximo 255 caracteres en la URL)");
      }

      client = await pool.connect();
      await client.query("BEGIN");
      const est = await establecimientoDelUsuario(
        (sql, params) => client.query(sql, params),
        req.user!.id,
        req.body?.id_sucursal,
      );
      const result = await client.query(
        `INSERT INTO insignias_sello (id_establecimiento, nombre, imagen_url)
         VALUES ($1, $2, $3)
         ON CONFLICT (id_establecimiento, imagen_url)
         DO UPDATE SET nombre = EXCLUDED.nombre, estado = 'ACTIVO'
         RETURNING id_insignia, nombre, imagen_url, fecha_creacion`,
        [est.id_establecimiento, nombre.trim(), imagen_url.trim()],
      );
      await client.query("COMMIT");
      sendResponse(res, 201, result.rows[0], "Insignia guardada en tu biblioteca");
    } catch (error) {
      if (client) await client.query("ROLLBACK");
      next(error);
    } finally {
      client?.release();
    }
  },

  /** Renombrar una insignia propia del establecimiento */
  async renombrarMiInsignia(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    let client: any;
    try {
      const idInsignia = req.params.id;
      const { nombre } = req.body;
      if (!isValidId(idInsignia)) throw new ApiError(400, "Identificador de insignia inválido");
      if (typeof nombre !== "string" || !nombre.trim() || nombre.trim().length > 80) {
        throw new ApiError(400, "El nombre de la insignia admite hasta 80 caracteres");
      }
      client = await pool.connect();
      await client.query("BEGIN");
      const est = await establecimientoDelUsuario(
        (sql, params) => client.query(sql, params),
        req.user!.id,
        req.query?.id_sucursal,
      );
      const result = await client.query(
        `UPDATE insignias_sello SET nombre = $3
         WHERE id_insignia = $1 AND id_establecimiento = $2
         RETURNING id_insignia, nombre, imagen_url, estado, fecha_creacion`,
        [idInsignia, est.id_establecimiento, nombre.trim()],
      );
      if (!result.rows[0]) throw new ApiError(404, "Insignia no encontrada");
      await client.query("COMMIT");
      sendResponse(res, 200, result.rows[0], "Nombre de insignia actualizado");
    } catch (error) {
      if (client) await client.query("ROLLBACK");
      next(error);
    } finally {
      client?.release();
    }
  },

  /** Archivar o restaurar una insignia, sin borrar imágenes usadas por diseños */
  async cambiarEstadoMiInsignia(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    let client: any;
    try {
      const idInsignia = req.params.id;
      const { estado } = req.body;
      if (!isValidId(idInsignia)) throw new ApiError(400, "Identificador de insignia inválido");
      if (estado !== "ACTIVO" && estado !== "INACTIVO") {
        throw new ApiError(400, "El estado debe ser ACTIVO o INACTIVO");
      }
      client = await pool.connect();
      await client.query("BEGIN");
      const est = await establecimientoDelUsuario(
        (sql, params) => client.query(sql, params),
        req.user!.id,
        req.query?.id_sucursal,
      );
      const result = await client.query(
        `UPDATE insignias_sello SET estado = $3
         WHERE id_insignia = $1 AND id_establecimiento = $2
         RETURNING id_insignia, nombre, imagen_url, estado, fecha_creacion`,
        [idInsignia, est.id_establecimiento, estado],
      );
      if (!result.rows[0]) throw new ApiError(404, "Insignia no encontrada");
      await client.query("COMMIT");
      sendResponse(res, 200, result.rows[0], estado === "ACTIVO" ? "Insignia restaurada" : "Insignia archivada");
    } catch (error) {
      if (client) await client.query("ROLLBACK");
      next(error);
    } finally {
      client?.release();
    }
  },

  /** Eliminar definitivamente una insignia de la biblioteca si no está en uso activo */
  async eliminarMiInsignia(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    let client: any;
    try {
      const idInsignia = req.params.id;
      if (!isValidId(idInsignia)) throw new ApiError(400, "Identificador de insignia inválido");

      client = await pool.connect();
      await client.query("BEGIN");
      const est = await establecimientoDelUsuario(
        (sql, params) => client.query(sql, params),
        req.user!.id,
        req.query?.id_sucursal,
      );

      const check = await client.query(
        `SELECT id_insignia, nombre, imagen_url FROM insignias_sello
         WHERE id_insignia = $1 AND id_establecimiento = $2`,
        [idInsignia, est.id_establecimiento],
      );
      if (!check.rows[0]) throw new ApiError(404, "Insignia no encontrada");

      // Comprobar si algún diseño de sello activo está usando la URL de esta insignia
      const enUso = await client.query(
        `SELECT COUNT(*)::int AS count FROM programas_sellos
         WHERE id_establecimiento = $1 AND imagen_sello = $2`,
        [est.id_establecimiento, check.rows[0].imagen_url],
      );

      if ((enUso.rows[0]?.count || 0) > 0) {
        // En lugar de romper diseños existentes, hacemos un archivado elegante
        await client.query(
          `UPDATE insignias_sello SET estado = 'INACTIVO' WHERE id_insignia = $1`,
          [idInsignia],
        );
        await client.query("COMMIT");
        return sendResponse(
          res,
          200,
          { id_insignia: idInsignia, archivada: true },
          "La insignia está asociada a sellos existentes. Ha sido archivada para no romper los diseños.",
        );
      }

      await client.query(
        `DELETE FROM insignias_sello WHERE id_insignia = $1 AND id_establecimiento = $2`,
        [idInsignia, est.id_establecimiento],
      );
      await client.query("COMMIT");
      sendResponse(res, 200, { id_insignia: idInsignia, eliminada: true }, "Insignia eliminada de la biblioteca con éxito");
    } catch (error) {
      if (client) await client.query("ROLLBACK");
      next(error);
    } finally {
      client?.release();
    }
  },
};
