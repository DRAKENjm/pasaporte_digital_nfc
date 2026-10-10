import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRoles } from "../middlewares/role.middleware";
import { AuthenticatedRequest } from "../types";

const router = Router();

// Proteger todas las rutas administrativas
router.use(authMiddleware, requireRoles("ADMIN", "ADMIN_GENERAL"));

router.get("/dashboard", AdminController.dashboard);

// Usuarios
router.get("/usuarios", AdminController.listarUsuarios);
router.post("/usuarios", AdminController.crearUsuario);
router.patch("/usuarios/:id", AdminController.actualizarUsuario);
router.patch("/usuarios/:id/password", AdminController.cambiarPasswordUsuario);
router.delete("/usuarios/:id", AdminController.eliminarUsuario);

// Locales y Establecimientos (Admin)
router.get("/locales", AdminController.listarLocales);
router.post("/locales", AdminController.crearLocal);
router.patch("/locales/:id", AdminController.actualizarLocal);
router.delete("/locales/:id", AdminController.eliminarLocal);

// Tarjetas NFC
router.get("/tarjetas", AdminController.listarTarjetas);
router.post("/tarjetas/stock", AdminController.registrarTarjetasStock);
router.patch("/tarjetas/:id/estado", AdminController.cambiarEstadoTarjeta);
router.patch("/tarjetas/:id/asignar", AdminController.asignarTarjetaCliente);

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
      `DELETE FROM recompensas WHERE id_recompensa = $1 RETURNING id_recompensa AS id`,
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

// ===== DISEÑO Y MODERACIÓN DE SELLOS DIGITALES =====
router.get("/sellos/historial", AdminController.listarHistorialSellos);
router.get("/sellos", AdminController.listarSellos);
router.post("/sellos", AdminController.crearSello);
router.post("/sellos/:id/restablecer", AdminController.restablecerSello);
router.patch("/sellos/:id/nfc", AdminController.vincularSelloNfc);
router.patch("/sellos/:id", AdminController.actualizarSello);
router.put("/sellos/:id", AdminController.actualizarSello);
router.delete("/sellos/:id", AdminController.eliminarSello);

// ===== NUEVO: Reglas de sellos (puntos por sello, límites, temporada) =====
router.get("/reglas-sellos", AdminController.listarReglasSellos);
router.post("/reglas-sellos", AdminController.crearReglaSello);
router.patch("/reglas-sellos/:id", AdminController.actualizarReglaSello);
router.delete("/reglas-sellos/:id", AdminController.eliminarReglaSello);

// ===== CATEGORÍAS DE LOCALES =====
router.get("/categorias", AdminController.listarCategorias);
router.post("/categorias", AdminController.crearCategoria);
router.patch("/categorias/:id", AdminController.actualizarCategoria);
router.delete("/categorias/:id", AdminController.eliminarCategoria);

// ===== CANJES Y ENTREGAS DE RECOMPENSAS =====
router.get("/canjes", AdminController.listarCanjes);
router.patch("/canjes/:id/estado", AdminController.actualizarEstadoCanje);

// ===== NOTIFICACIONES, AUDITORÍA Y VISITAS =====
router.get("/notificaciones", AdminController.resumenNotificaciones);
router.get("/auditoria", AdminController.listarAuditoria);
router.get("/documentos-legales", AdminController.listarDocumentosLegales);
router.post("/documentos-legales", AdminController.guardarDocumentoLegal);
router.patch("/documentos-legales/:id", AdminController.guardarDocumentoLegal);
router.get("/visitas", AdminController.listarVisitas);

// ===== REPORTES Y ANALÍTICAS CONSOLIDADAS =====
router.get("/reportes", AdminController.obtenerReportes);
router.get("/reportes/exportar/:tipo", AdminController.exportarReporte);

// ===== CONFIGURACIÓN DEL SISTEMA (Logo, Branding, etc.) =====
router.get("/configuracion", AdminController.obtenerConfiguracion);
router.put("/configuracion", AdminController.actualizarConfiguracion);

// ===== SUBIDA DE ARCHIVOS / FOTOS (Locales, Recompensas, etc.) =====
import multer from "multer";
import fs from "fs";
import path from "path";
import { sendResponse, ApiError } from "../utils";
import { uploadToSupabase } from "../services/storage.service";

const uploadDir = path.join(process.cwd(), "uploads", "locales");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Almacenamiento en memoria para enviar directamente a Supabase Storage
const memoryStorage = multer.memoryStorage();

const uploadMiddleware = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten imágenes (JPEG, PNG, WebP, GIF, AVIF)"));
    }
  },
});

router.post(
  "/upload",
  authMiddleware,
  requireRoles("ADMIN", "ADMIN_GENERAL"),
  uploadMiddleware.single("file"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!req.file) {
        throw new ApiError(400, "No se ha subido ningún archivo");
      }

      const ext = path.extname(req.file.originalname).toLowerCase() || ".jpg";
      const uniqueName = `local-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

      let finalUrl = "";

      // 1. Intentar subir directamente a Supabase Storage
      try {
        const supabaseRes = await uploadToSupabase(
          req.file.buffer,
          uniqueName,
          req.file.mimetype,
          "fotos",
        );
        finalUrl = supabaseRes.url;
      } catch (storageError: any) {
        console.warn("Fallo subida a Supabase en /admin/upload, guardando respaldo local:", storageError.message);
        const localPath = path.join(uploadDir, uniqueName);
        await fs.promises.writeFile(localPath, req.file.buffer);
        const host = req.get("host");
        const protocol = req.protocol;
        finalUrl = `${protocol}://${host}/uploads/locales/${uniqueName}`;
      }

      sendResponse(
        res,
        200,
        {
          url: finalUrl,
          filename: uniqueName,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
        "Archivo subido exitosamente",
      );
    } catch (error) {
      next(error);
    }
  },
);

export default router;
