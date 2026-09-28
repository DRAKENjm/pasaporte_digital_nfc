import { Router } from "express";
import { LegalController } from "../controllers/legal.controller";

const router = Router();

router.get("/documentos", LegalController.listDocumentos);
router.get("/documentos/:tipo", LegalController.getDocumento);

export default router;
