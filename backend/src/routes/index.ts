import { Router } from "express";
import authRoutes from "./auth.routes";
import nfcRoutes from "./nfc.routes";
import rewardsRoutes from "./rewards.routes";
import establishmentsRoutes from "./establishments.routes";
import activityRoutes from "./activity.routes";
import adminRoutes from "./admin.routes";
import claimsRoutes from "./claims.routes";
import mediaRoutes from "./media.routes";
import legalRoutes from "./legal.routes";
import friendsRoutes from "./friends.routes";

import { query } from "../config/database";
import { sendResponse } from "../utils";

const router = Router();

// Endpoint público para que la webapp lea el logo y nombre de la empresa sin requerir login admin
router.get("/config", async (req, res, next) => {
  try {
    const result = await query(
      "SELECT nombre_proyecto, logo_principal, logo_reducido, color_primario, color_secundario, correo_soporte, telefono_soporte FROM configuracion_sistema LIMIT 1"
    );
    const config = result.rows[0] || {
      nombre_proyecto: "Pasaporte Digital NFC",
      logo_principal: null,
      logo_reducido: null,
      color_primario: "#9B1B30",
      color_secundario: "#D4AF37",
    };
    sendResponse(res, 200, config, "Configuración pública del sistema");
  } catch (error) {
    next(error);
  }
});

router.use("/auth", authRoutes);
router.use("/nfc", nfcRoutes);
router.use("/rewards", rewardsRoutes);
router.use("/establishments", establishmentsRoutes);
router.use("/activity", activityRoutes);
router.use("/admin", adminRoutes);
router.use("/claims", claimsRoutes);
router.use("/media", mediaRoutes);
router.use("/legal", legalRoutes);
router.use("/friends", friendsRoutes);

export default router;
