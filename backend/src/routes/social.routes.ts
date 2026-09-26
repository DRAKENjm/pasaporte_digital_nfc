import { Router } from "express";
import { SocialController } from "../controllers/social.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

import { StoriesController } from "../controllers/stories.controller";
import { query } from "../config/database";
import { ApiError, sendResponse } from "../utils";
const router = Router();
router.get("/historias", authMiddleware, StoriesController.list);
router.post("/historias", authMiddleware, StoriesController.create);
router.delete("/historias/:id", authMiddleware, StoriesController.remove);
router.get("/publicaciones/:id", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT p.*,u.nombres AS autor_nombres,u.apellidos AS autor_apellidos FROM publicaciones p JOIN usuarios u ON u.id=p.usuario_id WHERE p.id=$1 AND p.visibilidad='PUBLICA' AND p.estado_moderacion='APROBADA'`,
      [req.params.id],
    );
    if (!result.rowCount) throw new ApiError(404, "Publicación no disponible");
    sendResponse(res, 200, result.rows[0]);
  } catch (e) {
    next(e);
  }
});
router.get(
  "/publicaciones/:id/comentarios",
  authMiddleware,
  async (req, res, next) => {
    try {
      const result = await query(
        `SELECT i.*,u.nombres,u.apellidos FROM interacciones i JOIN usuarios u ON u.id=i.usuario_id JOIN publicaciones p ON p.id=i.publicacion_id WHERE p.id=$1 AND p.visibilidad='PUBLICA' AND p.estado_moderacion='APROBADA' AND i.tipo_interaccion='COMENTARIO' ORDER BY i.created_at`,
        [req.params.id],
      );
      sendResponse(res, 200, result.rows);
    } catch (e) {
      next(e);
    }
  },
);

router.get("/feed", authMiddleware, SocialController.feed);
router.post(
  "/publicaciones",
  authMiddleware,
  SocialController.crearPublicacion,
);
router.post("/interacciones", authMiddleware, SocialController.reaccionar);

export default router;
