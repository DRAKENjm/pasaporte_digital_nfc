import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRoles } from "../middlewares/role.middleware";

const router = Router();

router.use(authMiddleware, requireRoles("ADMIN"));

router.get("/dashboard", AdminController.dashboard);

// Usuarios
router.get("/usuarios", AdminController.listarUsuarios);
router.patch("/usuarios/:id/estado", AdminController.cambiarEstadoUsuario);
router.patch("/usuarios/:id/rol", AdminController.cambiarRolUsuario);

// Tarjetas NFC
router.get("/tarjetas", AdminController.listarTarjetas);
router.post("/tarjetas/stock", AdminController.registrarTarjetasStock);
router.patch("/tarjetas/:id/estado", AdminController.cambiarEstadoTarjeta);

// Moderación
router.get("/moderacion", AdminController.moderacionPendiente);
router.patch(
  "/moderacion/publicaciones/:id",
  AdminController.moderarPublicacion,
);
router.patch("/moderacion/denuncias/:id", AdminController.resolverDenuncia);

// Recompensas y catálogos
router.get("/recompensas", AdminController.listarRecompensas);
router.post("/recompensas", AdminController.crearRecompensa);
router.patch("/recompensas/:id", AdminController.actualizarRecompensa);
router.delete("/recompensas/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { query } = await import("../config/database");
    const { ApiError, sendResponse } = await import("../utils");
    const result = await query(
      `DELETE FROM recompensas_plataforma WHERE id = $1 RETURNING id`,
      [id],
    );
    if (!result.rows[0]) throw new ApiError(404, "Recompensa no encontrada");
    sendResponse(res, 200, null, "Recompensa eliminada");
  } catch (error) {
    next(error);
  }
});
router.get("/niveles", AdminController.listarNiveles);
router.get("/roles", AdminController.listarRoles);

// ===== NUEVO: Reglas de sellos (puntos por sello, límites, temporada) =====
router.get("/reglas-sellos", AdminController.listarReglasSellos);
router.post("/reglas-sellos", AdminController.crearReglaSello);
router.patch("/reglas-sellos/:id", AdminController.actualizarReglaSello);

export default router;
