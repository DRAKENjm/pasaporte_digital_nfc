import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/google", AuthController.loginWithGoogle);
router.get("/profile", authMiddleware, AuthController.getProfile);
router.patch("/profile", authMiddleware, AuthController.updateProfile);
router.patch("/preferencias", authMiddleware, AuthController.updatePreferencias);
router.get("/preferencias", authMiddleware, AuthController.getPreferencias);

export default router;
