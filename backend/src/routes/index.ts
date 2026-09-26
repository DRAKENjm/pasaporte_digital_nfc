import { Router } from "express";
import authRoutes from "./auth.routes";
import nfcRoutes from "./nfc.routes";
import rewardsRoutes from "./rewards.routes";
import establishmentsRoutes from "./establishments.routes";
import activityRoutes from "./activity.routes";
import adminRoutes from "./admin.routes";
import claimsRoutes from "./claims.routes";
import mediaRoutes from "./media.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/nfc", nfcRoutes);
router.use("/rewards", rewardsRoutes);
router.use("/establishments", establishmentsRoutes);
router.use("/activity", activityRoutes);
router.use("/admin", adminRoutes);
router.use("/claims", claimsRoutes);
router.use("/media", mediaRoutes);

export default router;
