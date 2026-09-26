import { Router } from "express";
import { NfcVisitController } from "../controllers/nfc.visit.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

// 1. Identificar tarjeta (Lectura previa NFC)
router.post("/identificar", NfcVisitController.identificarTarjeta);

// 2. Confirmar visita (Acción del trabajador que genera Visita + Sello + Puntos)
router.post("/confirmar-visita", NfcVisitController.confirmarVisita);

// 3. Vincular / Activar tarjeta física a un cliente
router.post("/asignar-tarjeta", NfcVisitController.asignarTarjeta);

export default router;
