/**
 * SNIPPET para agregar a admin.controller.ts
 * Copia estos métodos dentro de AdminController = { ... }
 *
 * También ejecuta el SQL de temporada si aún no tienes columnas fecha_inicio/fecha_fin.
 */

/*
  // --- Reglas de sellos (puntos por sello, límites, temporada) ---

  async listarReglasSellos(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await query(`
        SELECT r.*, e.razon_social AS establecimiento_nombre
        FROM reglas_sellos r
        LEFT JOIN establecimientos e ON e.id = r.establecimiento_id
        ORDER BY r.created_at DESC
      `);
      sendResponse(res, 200, result.rows, 'Reglas de sellos');
    } catch (error) {
      next(error);
    }
  },

  async crearReglaSello(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const {
        establecimiento_id,
        nombre_accion,
        valor_puntos_por_sello = 10,
        limite_diario_por_usuario = 1,
        estado = 'ACTIVA',
        fecha_inicio = null,
        fecha_fin = null,
      } = req.body;

      if (!establecimiento_id || !nombre_accion) {
        throw new ApiError(400, 'establecimiento_id y nombre_accion son obligatorios');
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
        ]
      );

      sendResponse(res, 201, result.rows[0], 'Regla creada');
    } catch (error) {
      next(error);
    }
  },

  async actualizarReglaSello(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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
          valor_puntos_por_sello != null ? Number(valor_puntos_por_sello) : null,
          limite_diario_por_usuario != null ? Number(limite_diario_por_usuario) : null,
          estado ?? null,
          fecha_inicio ?? null,
          fecha_fin ?? null,
        ]
      );

      if (!result.rows[0]) throw new ApiError(404, 'Regla no encontrada');
      sendResponse(res, 200, result.rows[0], 'Regla actualizada');
    } catch (error) {
      next(error);
    }
  },
*/
