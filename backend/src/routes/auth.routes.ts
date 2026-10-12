import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authLimiter } from "../middlewares/rateLimiter";

const router = Router();

router.post("/register", authLimiter, AuthController.register);
router.post("/login", authLimiter, AuthController.login);
router.post("/google", authLimiter, AuthController.loginWithGoogle);
router.get("/profile", authMiddleware, AuthController.getProfile);
router.patch("/profile", authMiddleware, AuthController.updateProfile);
router.patch("/preferencias", authMiddleware, AuthController.updatePreferencias);
router.get("/preferencias", authMiddleware, AuthController.getPreferencias);

export default router;
