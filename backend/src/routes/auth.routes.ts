import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

import { RecoveryController } from "../controllers/recovery.controller";
import { query } from "../config/database";
import { AuthenticatedRequest } from "../types";
import { ApiError, sendResponse } from "../utils";
import { validateMedia } from "../controllers/stories.controller";
const router = Router();
router.patch(
  "/profile",
  authMiddleware,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { nombres, apellidos, username, avatar_url } = req.body;
      if (
        nombres !== undefined &&
        (!String(nombres).trim() || String(nombres).length > 100)
      )
        throw new ApiError(400, "Nombre inválido");
      if (
        apellidos !== undefined &&
        (!String(apellidos).trim() || String(apellidos).length > 100)
      )
        throw new ApiError(400, "Apellidos inválidos");
      if (avatar_url) validateMedia(avatar_url);
      const result = await query(
        "UPDATE usuarios SET nombres=COALESCE($2,nombres),apellidos=COALESCE($3,apellidos),username=COALESCE($4,username),avatar_url=COALESCE($5,avatar_url),updated_at=now() WHERE id=$1 RETURNING id",
        [req.user!.id, nombres, apellidos, username?.slice(0, 60), avatar_url],
      );
      sendResponse(res, 200, result.rows[0]);
    } catch (e) {
      next(e);
    }
  },
);
const attempts = new Map<string, { count: number; until: number }>();
router.use((req, res, next) => {
  const key = req.ip || "unknown";
  const now = Date.now();
  for (const [k, v] of attempts) if (v.until < now) attempts.delete(k);
  const entry = attempts.get(key) || { count: 0, until: now + 600000 };
  entry.count++;
  attempts.set(key, entry);
  if (entry.count > 40)
    return res
      .status(429)
      .json({ message: "Demasiados intentos. Espera 10 minutos." });
  next();
});
router.post("/recover", RecoveryController.request);
router.post("/reset-password", RecoveryController.reset);

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/google", AuthController.googleLogin);
router.post("/verify-email", AuthController.verifyEmail);
router.get("/profile", authMiddleware, AuthController.getProfile);

export default router;
