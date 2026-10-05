import { Router } from "express";
import { ActivityController } from "../controllers/activity.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

// Feed unificado de actividad (visitas, sellos y puntos ledger)
router.get("/feed", ActivityController.feed);

// Sellos del usuario agrupados por establecimiento
router.get("/mis-sellos", ActivityController.misSellos);

// Notificaciones del usuario
router.get("/notificaciones", ActivityController.notificaciones);
router.patch("/notificaciones/:id/leer", ActivityController.marcarNotificacionLeida);
router.delete("/notificaciones/:id", ActivityController.eliminarNotificacion);
router.delete("/notificaciones", ActivityController.vaciarNotificaciones);

export default router;
