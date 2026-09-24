import { Router } from "express";
import { PointsController } from "../controllers/points.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRoles } from "../middlewares/role.middleware";
import { fraudCheck } from "../middlewares/fraud.middleware";

import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { PointsService } from "../services/points.service";
import { ApiError, sendResponse } from "../utils";
import { AuthenticatedRequest } from "../types";
const router = Router();

router.use(authMiddleware);
router.use(fraudCheck);
router.get("/qr", (req: AuthenticatedRequest, res, next) => {
  try {
    const token = jwt.sign(
      { sub: req.user!.id, purpose: "visit", jti: randomUUID() },
      process.env.JWT_SECRET!,
      { expiresIn: "5m", audience: "pasaporte-visit" },
    );
    sendResponse(res, 200, { token, expiresAt: Date.now() + 300000 });
  } catch (e) {
    next(e);
  }
});
router.post(
  "/validar-qr",
  requireRoles("COMERCIO", "ADMIN"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      let decoded: any;
      try {
        decoded = jwt.verify(req.body.token, process.env.JWT_SECRET!, {
          audience: "pasaporte-visit",
        });
      } catch {
        throw new ApiError(400, "QR inválido o caducado. Solicita uno nuevo");
      }
      if (decoded.purpose !== "visit" || !decoded.sub || !decoded.jti)
        throw new ApiError(400, "QR no reconocido");
      const result = await PointsService.validarYAcreditar({
        usuarioId: decoded.sub,
        establecimientoId: req.body.establecimiento_id,
        personalValidadorId: req.user!.id,
        metodo: "QR",
        ip: req.ip,
        jti: decoded.jti,
        exp: decoded.exp,
      });
      sendResponse(res, 200, result);
    } catch (e) {
      next(e);
    }
  },
);

// Usuario vincula su tarjeta
router.post("/asignar-tarjeta", PointsController.asignarTarjeta);

// Historial del usuario autenticado
router.get("/historial", PointsController.historial);

// Validación (solo comercio / admin)
router.post(
  "/validar",
  requireRoles("COMERCIO", "ADMIN"),
  PointsController.validarVisita,
);

router.post(
  "/validar-nfc",
  requireRoles("COMERCIO", "ADMIN"),
  PointsController.validarPorNfc,
);

export default router;
