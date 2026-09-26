import { Router } from "express";
import { ClaimsController } from "../controllers/claims.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRoles } from "../middlewares/role.middleware";

const router = Router();

// Registro público o autenticado
router.post("/", ClaimsController.registrar);

// Consulta pública por código de seguimiento
router.get("/track/:codigo", ClaimsController.consultarPorCodigo);

// Endpoints protegidos para Administradores
router.get("/", authMiddleware, requireRoles("ADMIN", "ADMIN_GENERAL"), ClaimsController.listarAdmin);
router.patch(
  "/:id/responder",
  authMiddleware,
  requireRoles("ADMIN", "ADMIN_GENERAL"),
  ClaimsController.responderAdmin,
);

export default router;
