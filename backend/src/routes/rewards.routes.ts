import { Router } from "express";
import { RewardsController } from "../controllers/rewards.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Catálogo de recompensas disponible públicamente o para usuarios
router.get("/", RewardsController.listar);

// Endpoints protegidos para clientes y trabajadores
router.use(authMiddleware);
router.post("/solicitar", RewardsController.solicitarCanje);
router.post("/canjear", RewardsController.solicitarCanje);
router.post("/confirmar-entrega", RewardsController.confirmarEntrega);
router.get("/mis-canjes", RewardsController.misCanjes);

export default router;
