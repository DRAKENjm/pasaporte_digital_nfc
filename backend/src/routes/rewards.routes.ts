import { Router } from "express";
import { RewardsController } from "../controllers/rewards.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddleware, RewardsController.listar);
router.post("/canjear", authMiddleware, RewardsController.canjear);
router.get("/mis-canjes", authMiddleware, RewardsController.misCanjes);

export default router;
