import { Router } from "express";
import { FriendsController } from "../controllers/friends.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRoles } from "../middlewares/role.middleware";

const router = Router();

// Exclusivo para rol CLIENTE
router.use(authMiddleware, requireRoles("CLIENTE"));

router.get("/", FriendsController.listarAmigos);
router.get("/solicitudes", FriendsController.listarSolicitudesPendientes);
router.post("/solicitudes", FriendsController.enviarSolicitud);
router.patch("/solicitudes/:id/responder", FriendsController.responderSolicitud);
router.delete("/:amigo_id", FriendsController.eliminarAmigo);

export default router;
