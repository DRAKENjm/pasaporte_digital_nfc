import { Router } from "express";
import { NfcVisitController } from "../controllers/nfc.visit.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/identificar", NfcVisitController.identificarTarjeta);
router.post("/confirmar-visita", NfcVisitController.confirmarVisita);
router.post("/asignar-tarjeta", NfcVisitController.asignarTarjeta);
router.post("/autosellar", NfcVisitController.autosellarVisita);

router.get("/tarjeta/personalizacion", NfcVisitController.obtenerPersonalizacion);
router.patch("/tarjeta/personalizacion", NfcVisitController.personalizarTarjeta);

export default router;
