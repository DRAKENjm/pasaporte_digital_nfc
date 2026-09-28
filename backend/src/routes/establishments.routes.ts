import { Router } from "express";
import { EstablishmentsController } from "../controllers/establishments.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Endpoints de métricas y gestión para el comercio autenticado
router.get("/me/sucursales", authMiddleware, EstablishmentsController.misSucursales);
router.get("/me/stats", authMiddleware, EstablishmentsController.misStats);
router.get("/me/visitas", authMiddleware, EstablishmentsController.misVisitas);
router.get("/me/clientes", authMiddleware, EstablishmentsController.misClientes);
router.get("/me/recompensas", authMiddleware, EstablishmentsController.misRecompensas);
router.get("/me/canjes", authMiddleware, EstablishmentsController.misCanjes);
router.get("/me/sello", authMiddleware, EstablishmentsController.miSello);
router.put("/me/sello", authMiddleware, EstablishmentsController.actualizarMiSello);

// Diseños de sello: varios por establecimiento (CRUD + activar/desactivar)
router.get("/me/sellos", authMiddleware, EstablishmentsController.misSellos);
router.post("/me/sellos", authMiddleware, EstablishmentsController.crearMiSello);
router.put("/me/sellos/:id", authMiddleware, EstablishmentsController.actualizarMiSelloDiseño);
router.patch("/me/sellos/:id/estado", authMiddleware, EstablishmentsController.cambiarEstadoMiSello);
router.get("/me/insignias", authMiddleware, EstablishmentsController.misInsignias);
router.post("/me/insignias", authMiddleware, EstablishmentsController.crearMiInsignia);
router.put("/me/insignias/:id", authMiddleware, EstablishmentsController.renombrarMiInsignia);
router.patch("/me/insignias/:id/estado", authMiddleware, EstablishmentsController.cambiarEstadoMiInsignia);

// Categorías públicas / para el panel
router.get("/categorias", authMiddleware, EstablishmentsController.listarCategorias);

// Descubrir locales para la pantalla Explorar
router.get("/", authMiddleware, EstablishmentsController.listar);
router.get("/:id", authMiddleware, EstablishmentsController.detalle);

export default router;
