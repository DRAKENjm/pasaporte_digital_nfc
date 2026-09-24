import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { query } from "../config/database";
import { ApiError, sendResponse } from "../utils";
export function validateMedia(value: unknown) {
  if (
    typeof value !== "string" ||
    !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value) ||
    value.length > 7000000
  )
    throw new ApiError(
      400,
      "Selecciona una imagen JPEG, PNG o WebP de hasta 5 MB",
    );
  return value;
}
export const StoriesController = {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const rows = await query(
        `SELECT h.id, h.usuario_id AS "userId", concat(u.nombres,' ',u.apellidos) AS "userName", u.avatar_url AS "avatar", h.media_url AS "mediaUrl", h.media_type AS "mediaType", h.caption, h.filtro AS filter, h.created_at AS "createdAt" FROM historias h JOIN usuarios u ON u.id=h.usuario_id WHERE h.expires_at>now() ORDER BY h.created_at ASC`,
      );
      sendResponse(res, 200, rows.rows);
    } catch (e) {
      next(e);
    }
  },
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const media = validateMedia(req.body.mediaUrl);
      const result = await query(
        `INSERT INTO historias(usuario_id,media_url,media_type,caption,filtro) VALUES($1,$2,'image',$3,$4) RETURNING id`,
        [
          req.user!.id,
          media,
          String(req.body.caption || "").slice(0, 500),
          "none",
        ],
      );
      sendResponse(res, 201, result.rows[0]);
    } catch (e) {
      next(e);
    }
  },
  async remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await query(
        "DELETE FROM historias WHERE id=$1 AND usuario_id=$2 RETURNING id",
        [req.params.id, req.user!.id],
      );
      if (!result.rowCount)
        throw new ApiError(404, "Historia no encontrada o no te pertenece");
      sendResponse(res, 200, null, "Historia eliminada");
    } catch (e) {
      next(e);
    }
  },
};
