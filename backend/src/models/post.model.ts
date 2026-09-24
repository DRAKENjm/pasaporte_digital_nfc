import { ApiError } from "../utils";
import { query } from "../config/database";

export const PostModel = {
  async create(data: {
    usuario_id: string;
    establecimiento_id?: string | null;
    texto_contenido?: string | null;
    url_media?: string | null;
    tipo_media?: "IMAGEN" | "VIDEO";
    url_thumbnail?: string | null;
    duracion_segundos?: number;
    visibilidad?: "PUBLICA" | "PRIVADA" | "AMIGOS";
  }) {
    const res = await query(
      `INSERT INTO publicaciones
         (usuario_id, establecimiento_id, texto_contenido, url_media, tipo_media,
          url_thumbnail, duracion_segundos, visibilidad)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.usuario_id,
        data.establecimiento_id || null,
        data.texto_contenido || null,
        data.url_media || null,
        data.tipo_media || "IMAGEN",
        data.url_thumbnail || null,
        data.duracion_segundos || 0,
        data.visibilidad || "PUBLICA",
      ],
    );
    return res.rows[0];
  },

  async feed(limit = 30, offset = 0, userId?: string) {
    const res = await query(
      `SELECT p.*,
              (SELECT count(*)::int FROM interacciones i WHERE i.publicacion_id=p.id AND i.tipo_interaccion='REACCION') AS likes_count,
              EXISTS(SELECT 1 FROM interacciones i WHERE i.publicacion_id=p.id AND i.usuario_id=$3 AND i.tipo_interaccion='REACCION') AS has_liked,
              u.nombres AS autor_nombres,
              u.apellidos AS autor_apellidos,
              u.username AS autor_username,
              u.avatar_url AS autor_avatar,
              e.razon_social AS establecimiento_nombre
       FROM publicaciones p
       JOIN usuarios u ON u.id = p.usuario_id
       LEFT JOIN establecimientos e ON e.id = p.establecimiento_id
       WHERE p.estado_moderacion = 'APROBADA'
         AND p.visibilidad = 'PUBLICA'
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset, userId],
    );
    return res.rows;
  },

  async addInteraccion(
    publicacionId: string,
    usuarioId: string,
    tipo: "REACCION" | "COMENTARIO",
    comentario?: string,
  ) {
    if (!["REACCION", "COMENTARIO"].includes(tipo))
      throw new ApiError(400, "Tipo inválido");
    if (
      tipo === "COMENTARIO" &&
      (!comentario?.trim() || comentario.length > 1000)
    )
      throw new ApiError(400, "Escribe un comentario de hasta 1000 caracteres");
    const visible = await query(
      "SELECT id FROM publicaciones WHERE id=$1 AND visibilidad='PUBLICA' AND estado_moderacion='APROBADA'",
      [publicacionId],
    );
    if (!visible.rowCount) throw new ApiError(404, "Publicación no disponible");
    if (tipo === "REACCION") {
      const removed = await query(
        "DELETE FROM interacciones WHERE publicacion_id=$1 AND usuario_id=$2 AND tipo_interaccion='REACCION' RETURNING id",
        [publicacionId, usuarioId],
      );
      if (removed.rowCount) return { has_liked: false };
    }
    const res = await query(
      `INSERT INTO interacciones (publicacion_id, usuario_id, tipo_interaccion, comentario)
       VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING
       RETURNING *`,
      [publicacionId, usuarioId, tipo, comentario || null],
    );
    return res.rows[0];
  },

  async getInteracciones(publicacionId: string) {
    const res = await query(
      `SELECT i.*, u.nombres, u.apellidos
       FROM interacciones i
       JOIN usuarios u ON u.id = i.usuario_id
       WHERE i.publicacion_id = $1
       ORDER BY i.created_at ASC`,
      [publicacionId],
    );
    return res.rows;
  },
};
