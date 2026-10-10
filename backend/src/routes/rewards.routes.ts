import { Router } from "express";
import { RewardsController } from "../controllers/rewards.controller";
import { authMiddleware, optionalAuthMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Catálogo de recompensas disponible públicamente o para usuarios (con optionalAuth para calcular canjeado_hoy)
router.get("/", optionalAuthMiddleware, RewardsController.listar);

// Endpoints protegidos para clientes y trabajadores
router.use(authMiddleware);
router.post("/solicitar", RewardsController.solicitarCanje);
router.post("/canjear", RewardsController.solicitarCanje);
router.post("/cancelar", RewardsController.cancelarCanje);
router.post("/confirmar-entrega", RewardsController.confirmarEntrega);
router.get("/mis-canjes", RewardsController.misCanjes);

export default router;
