import { Response, NextFunction } from 'express';
import { query } from '../config/database';
import { ApiError, sendResponse, hashPassword } from '../utils';
import { AuthenticatedRequest } from '../types';

export const AdminController = {
  /** Dashboard: contadores generales */
  async dashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const [usuarios, locales, visitas, canjes, publicaciones, tarjetas] = await Promise.all([
        query(`SELECT COUNT(*)::int AS total FROM usuarios`),
        query(`SELECT COUNT(*)::int AS total FROM establecimientos WHERE estado = 'ACTIVO'`),
        query(`SELECT COUNT(*)::int AS total FROM historial_visitas_sellos`),
        query(`SELECT COUNT(*)::int AS total FROM historial_canjes`),
        query(`SELECT COUNT(*)::int AS total FROM publicaciones WHERE estado_moderacion = 'APROBADA'`),
        query(`SELECT COUNT(*)::int AS total FROM tarjetas_nfc`),
      ]);

      sendResponse(
        res,
        200,
        {
          usuarios: usuarios.rows[0].total,
          establecimientos_activos: locales.rows[0].total,
          visitas_totales: visitas.rows[0].total,
          canjes_totales: canjes.rows[0].total,
          publicaciones: publicaciones.rows[0].total,
          tarjetas_nfc: tarjetas.rows[0].total,
        },
        'Dashboard admin'
      );
    } catch (error) {
      next(error);
    }
  },

  /** Listar usuarios */
  async listarUsuarios(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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

      sql += ' ORDER BY u.created_at DESC LIMIT 200';
      const result = await query(sql, params);
      sendResponse(res, 200, result.rows, 'Usuarios');
    } catch (error) {
      next(error);
    }
  },

  /** Cambiar estado de usuario (ACTIVO / INACTIVO / BLOQUEADO) */
  async cambiarEstadoUsuario(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      if (!['ACTIVO', 'INACTIVO', 'BLOQUEADO'].includes(estado)) {
        throw new ApiError(400, 'Estado inválido');
      }

      const result = await query(
        `UPDATE usuarios SET estado = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id, email, nombres, apellidos, estado`,
        [id, estado]
      );
      if (!result.rows[0]) throw new ApiError(404, 'Usuario no encontrado');
      sendResponse(res, 200, result.rows[0], 'Estado actualizado');
    } catch (error) {
      next(error);
    }
  },

  /** Cambiar rol de usuario */
  async cambiarRolUsuario(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { rol } = req.body; // ADMIN | CLIENTE | COMERCIO

      const roleRes = await query(`SELECT id FROM roles WHERE nombre = $1`, [rol]);
      if (!roleRes.rows[0]) throw new ApiError(400, 'Rol no existe');

      const result = await query(
        `UPDATE usuarios SET rol_id = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id, email`,
        [id, roleRes.rows[0].id]
      );
      if (!result.rows[0]) throw new ApiError(404, 'Usuario no encontrado');
      sendResponse(res, 200, { ...result.rows[0], rol }, 'Rol actualizado');
    } catch (error) {
      next(error);
    }
  },

  /** Inventario de tarjetas NFC */
  async listarTarjetas(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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
      sql += ' ORDER BY t.created_at DESC LIMIT 500';
      const result = await query(sql, params);
      sendResponse(res, 200, result.rows, 'Tarjetas NFC');
    } catch (error) {
      next(error);
    }
  },

  /** Registrar tarjetas en stock (lote) */
  async registrarTarjetasStock(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { uids } = req.body; // string[]
      if (!Array.isArray(uids) || uids.length === 0) {
        throw new ApiError(400, 'Envía un array uids con los UID NFC');
      }

      const insertadas: any[] = [];
      for (const uid of uids) {
        const qr = `https://pasaporte.nfc/r/${String(uid).replace(/[^a-zA-Z0-9]/g, '')}`;
        try {
          const r = await query(
            `INSERT INTO tarjetas_nfc (uid_nfc, qr_respaldo, estado)
             VALUES ($1, $2, 'EN_STOCK')
             ON CONFLICT (uid_nfc) DO NOTHING
             RETURNING *`,
            [uid, qr]
          );
          if (r.rows[0]) insertadas.push(r.rows[0]);
        } catch {
          // continuar con el resto
        }
      }

      sendResponse(res, 201, { insertadas: insertadas.length, tarjetas: insertadas }, 'Tarjetas registradas en stock');
    } catch (error) {
      next(error);
    }
  },

  /** Bloquear / marcar extraviada una tarjeta */
  async cambiarEstadoTarjeta(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      if (!['EN_STOCK', 'ASIGNADA', 'EXTRAVIADA', 'BLOQUEADA'].includes(estado)) {
        throw new ApiError(400, 'Estado de tarjeta inválido');
      }

      const result = await query(
        `UPDATE tarjetas_nfc SET estado = $2 WHERE id = $1 RETURNING *`,
        [id, estado]
      );
      if (!result.rows[0]) throw new ApiError(404, 'Tarjeta no encontrada');
      sendResponse(res, 200, result.rows[0], 'Estado de tarjeta actualizado');
    } catch (error) {
      next(error);
    }
  },

  /** Moderación: listar publicaciones en revisión o denuncias */
  async moderacionPendiente(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pubs = await query(
        `SELECT p.*, u.nombres AS autor_nombres, u.apellidos AS autor_apellidos, u.email AS autor_email
         FROM publicaciones p
         JOIN usuarios u ON u.id = p.usuario_id
         WHERE p.estado_moderacion IN ('REVISION', 'OCULTA')
         ORDER BY p.created_at DESC
         LIMIT 100`
      );

      const denuncias = await query(
        `SELECT d.*, p.texto_contenido, u.nombres AS reportador_nombres, u.email AS reportador_email
         FROM denuncias_moderacion d
         JOIN publicaciones p ON p.id = d.publicacion_id
         JOIN usuarios u ON u.id = d.usuario_reportador_id
         WHERE d.estado_revision = 'PENDIENTE'
         ORDER BY d.fecha_reporte DESC
         LIMIT 100`
      );

      sendResponse(res, 200, { publicaciones: pubs.rows, denuncias: denuncias.rows }, 'Cola de moderación');
    } catch (error) {
      next(error);
    }
  },

  /** Resolver moderación de una publicación */
  async moderarPublicacion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new ApiError(401, 'No autenticado');
      const { id } = req.params;
      const { estado_moderacion } = req.body; // APROBADA | OCULTA | ELIMINADA | REVISION

      if (!['APROBADA', 'REVISION', 'OCULTA', 'ELIMINADA'].includes(estado_moderacion)) {
        throw new ApiError(400, 'estado_moderacion inválido');
      }

      const result = await query(
        `UPDATE publicaciones SET estado_moderacion = $2 WHERE id = $1 RETURNING *`,
        [id, estado_moderacion]
      );
      if (!result.rows[0]) throw new ApiError(404, 'Publicación no encontrada');
      sendResponse(res, 200, result.rows[0], 'Publicación moderada');
    } catch (error) {
      next(error);
    }
  },

  /** Resolver denuncia */
  async resolverDenuncia(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new ApiError(401, 'No autenticado');
      const { id } = req.params;
      const { estado_revision } = req.body; // REVISADO | DESCARTADO

      if (!['REVISADO', 'DESCARTADO'].includes(estado_revision)) {
        throw new ApiError(400, 'estado_revision inválido');
      }

      const result = await query(
        `UPDATE denuncias_moderacion SET
           estado_revision = $2,
           admin_revisor_id = $3,
           fecha_revision = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [id, estado_revision, req.user.id]
      );
      if (!result.rows[0]) throw new ApiError(404, 'Denuncia no encontrada');
      sendResponse(res, 200, result.rows[0], 'Denuncia resuelta');
    } catch (error) {
      next(error);
    }
  },

  /** Crear recompensa (admin) */
  async crearRecompensa(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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
        throw new ApiError(400, 'nombre_recompensa y costo_puntos_globales son obligatorios');
      }

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
          tipo_entrega || 'OFICINA_CENTRAL',
          direccion_recojo || null,
          fecha_inicio || null,
          fecha_fin || null,
        ]
      );

      sendResponse(res, 201, result.rows[0], 'Recompensa creada');
    } catch (error) {
      next(error);
    }
  },

  /** Niveles de pasaporte */
  async listarNiveles(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await query(
        `SELECT * FROM niveles_pasaporte WHERE estado = TRUE ORDER BY sellos_requeridos ASC`
      );
      sendResponse(res, 200, result.rows, 'Niveles');
    } catch (error) {
      next(error);
    }
  },

  /** Roles del sistema */
  async listarRoles(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await query(`SELECT * FROM roles ORDER BY nombre`);
      sendResponse(res, 200, result.rows, 'Roles');
    } catch (error) {
      next(error);
    }
  },
};
