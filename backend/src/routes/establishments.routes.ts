import { Router } from "express";
import { EstablishmentsController } from "../controllers/establishments.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRoles } from "../middlewares/role.middleware";

import { query } from "../config/database";
import { AuthenticatedRequest } from "../types";
import { sendResponse } from "../utils";
const router = Router();
router.get(
  "/me/locales",
  authMiddleware,
  requireRoles("COMERCIO", "ADMIN"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await query(
        `SELECT e.* FROM establecimientos e WHERE e.estado='ACTIVO' AND ($2='ADMIN' OR EXISTS(SELECT 1 FROM personal_establecimiento p WHERE p.establecimiento_id=e.id AND p.usuario_id=$1 AND p.estado=TRUE)) ORDER BY e.razon_social`,
        [req.user!.id, req.user!.role],
      );
      sendResponse(res, 200, result.rows);
    } catch (e) {
      next(e);
    }
  },
);
router.get(
  "/me/visitas",
  authMiddleware,
  requireRoles("COMERCIO", "ADMIN"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await query(
        `SELECT h.*,u.nombres AS usuario_nombres,u.apellidos AS usuario_apellidos FROM historial_visitas_sellos h JOIN usuarios u ON u.id=h.usuario_id WHERE ($2='ADMIN' OR EXISTS(SELECT 1 FROM personal_establecimiento p WHERE p.establecimiento_id=h.establecimiento_id AND p.usuario_id=$1 AND p.estado=TRUE)) AND ($3::uuid IS NULL OR h.establecimiento_id=$3) ORDER BY h.fecha_hora DESC LIMIT 200`,
        [req.user!.id, req.user!.role, req.query.establecimiento_id || null],
      );
      sendResponse(res, 200, result.rows);
    } catch (e) {
      next(e);
    }
  },
);
router.get(
  "/me/stats",
  authMiddleware,
  requireRoles("COMERCIO", "ADMIN"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await query(
        `SELECT count(*) FILTER(WHERE fecha_hora>=CURRENT_DATE)::int AS visitas_hoy,count(*) FILTER(WHERE fecha_hora>=date_trunc('month',now()))::int AS visitas_mes,coalesce(sum(puntos_ganados) FILTER(WHERE fecha_hora>=CURRENT_DATE),0)::int AS puntos_hoy FROM historial_visitas_sellos h WHERE ($2='ADMIN' OR EXISTS(SELECT 1 FROM personal_establecimiento p WHERE p.establecimiento_id=h.establecimiento_id AND p.usuario_id=$1 AND p.estado=TRUE))`,
        [req.user!.id, req.user!.role],
      );
      sendResponse(res, 200, result.rows[0]);
    } catch (e) {
      next(e);
    }
  },
);

// Público autenticado: descubrir locales
router.get("/", authMiddleware, EstablishmentsController.listar);
router.get("/categorias", authMiddleware, EstablishmentsController.categorias);
router.get("/:id", authMiddleware, EstablishmentsController.detalle);
router.get(
  "/:id/reglas",
  authMiddleware,
  EstablishmentsController.listarReglas,
);
router.get(
  "/:id/estadisticas",
  authMiddleware,
  requireRoles("ADMIN"),
  EstablishmentsController.estadisticas,
);

// Comercio / Admin
router.post(
  "/",
  authMiddleware,
  requireRoles("ADMIN"),
  EstablishmentsController.crear,
);
router.patch(
  "/:id",
  authMiddleware,
  requireRoles("ADMIN"),
  EstablishmentsController.actualizar,
);
router.post(
  "/:id/reglas",
  authMiddleware,
  requireRoles("ADMIN"),
  EstablishmentsController.crearRegla,
);
router.patch(
  "/reglas/:reglaId",
  authMiddleware,
  requireRoles("ADMIN"),
  EstablishmentsController.actualizarRegla,
);
router.post(
  "/:id/personal",
  authMiddleware,
  requireRoles("ADMIN"),
  EstablishmentsController.agregarPersonal,
);
router.delete(
  "/:id",
  authMiddleware,
  requireRoles("ADMIN"),
  EstablishmentsController.eliminar,
);

export default router;
