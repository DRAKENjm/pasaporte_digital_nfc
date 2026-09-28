import { Router } from "express";
import { EstablishmentsController } from "../controllers/establishments.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/me/stats", authMiddleware, EstablishmentsController.misStats);
router.get("/me/visitas", authMiddleware, EstablishmentsController.misVisitas);
router.get("/me/clientes", authMiddleware, EstablishmentsController.misClientes);
router.get("/me/recompensas", authMiddleware, EstablishmentsController.misRecompensas);
router.get("/me/canjes", authMiddleware, EstablishmentsController.misCanjes);
router.get("/me/sello", authMiddleware, EstablishmentsController.miSello);
router.put("/me/sello", authMiddleware, EstablishmentsController.actualizarMiSello);

router.get("/categorias", authMiddleware, EstablishmentsController.listarCategorias);
router.get("/favoritos", authMiddleware, EstablishmentsController.listarFavoritos);
router.post("/:id/favorito", authMiddleware, EstablishmentsController.toggleFavorito);
router.delete("/:id/favorito", authMiddleware, EstablishmentsController.toggleFavorito);

router.get("/", authMiddleware, EstablishmentsController.listar);
router.get("/:id", authMiddleware, EstablishmentsController.getById);

export default router;
