import { Router } from "express";
import { EstablishmentsController } from "../controllers/establishments.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Endpoints de métricas y gestión para el comercio autenticado
router.get("/me/stats", authMiddleware, EstablishmentsController.misStats);
router.get("/me/visitas", authMiddleware, EstablishmentsController.misVisitas);
router.get("/me/clientes", authMiddleware, EstablishmentsController.misClientes);
router.get("/me/recompensas", authMiddleware, EstablishmentsController.misRecompensas);
router.get("/me/canjes", authMiddleware, EstablishmentsController.misCanjes);
router.get("/me/sello", authMiddleware, EstablishmentsController.miSello);
router.put("/me/sello", authMiddleware, EstablishmentsController.actualizarMiSello);

// Categorías públicas / para el panel
router.get("/categorias", authMiddleware, EstablishmentsController.listarCategorias);

// Descubrir locales para la pantalla Explorar
router.get("/", authMiddleware, EstablishmentsController.listar);
router.get("/:id", authMiddleware, EstablishmentsController.detalle);

export default router;
