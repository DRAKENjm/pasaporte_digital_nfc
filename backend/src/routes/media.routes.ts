import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { authMiddleware } from "../middlewares/auth.middleware";
import { sendResponse, ApiError } from "../utils";
import { AuthenticatedRequest } from "../types";
import { query } from "../config/database";
import { uploadToSupabase, deleteFromSupabase } from "../services/storage.service";

const router = Router();

// Directorio local de respaldo
const uploadDir = path.join(process.cwd(), "uploads", "fotos");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Almacenamiento en memoria para enviar directamente a Supabase Storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
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
  upload.single("file"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!req.file) {
        throw new ApiError(400, "No se ha subido ningún archivo");
      }

      const ext = path.extname(req.file.originalname).toLowerCase() || ".jpg";
      const uniqueName = `img-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

      let finalUrl = "";

      // 1. Intentar subir directamente a Supabase Storage en la nube
      try {
        const supabaseRes = await uploadToSupabase(
          req.file.buffer,
          uniqueName,
          req.file.mimetype,
          "fotos"
        );
        finalUrl = supabaseRes.url;
      } catch (storageError: any) {
        console.warn("Fallo subida a Supabase, guardando copia local de respaldo:", storageError.message);
        // Respaldo en disco local si Supabase Storage no está listo
        const localPath = path.join(uploadDir, uniqueName);
        await fs.promises.writeFile(localPath, req.file.buffer);
        const host = req.get("host");
        const protocol = req.protocol;
        finalUrl = `${protocol}://${host}/uploads/fotos/${uniqueName}`;
      }

      await query(
        `INSERT INTO archivos_media_subidos (nombre_archivo, id_usuario)
         VALUES ($1, $2)`,
        [uniqueName, req.user!.id],
      );

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

router.delete("/upload/:filename", authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { filename } = req.params;
    if (!/^img-\d+-\d+\.(jpg|jpeg|png|webp|gif|avif)$/i.test(filename)) {
      throw new ApiError(400, "Nombre de archivo inválido");
    }
    const owned = await query(
      `SELECT 1 FROM archivos_media_subidos WHERE nombre_archivo = $1 AND id_usuario = $2`,
      [filename, req.user!.id],
    );
    if (!owned.rows.length) throw new ApiError(404, "Archivo temporal no encontrado");

    const references = await query(
      `SELECT
         EXISTS (SELECT 1 FROM programas_sellos WHERE RIGHT(COALESCE(imagen_sello, ''), LENGTH($1)) = $1)
         OR EXISTS (SELECT 1 FROM insignias_sello WHERE RIGHT(COALESCE(imagen_url, ''), LENGTH($1)) = $1)
         OR EXISTS (SELECT 1 FROM establecimientos WHERE RIGHT(COALESCE(logo, ''), LENGTH($1)) = $1)
         OR EXISTS (SELECT 1 FROM usuarios WHERE RIGHT(COALESCE(foto_perfil, ''), LENGTH($1)) = $1)
         OR EXISTS (SELECT 1 FROM recompensas WHERE RIGHT(COALESCE(imagen, ''), LENGTH($1)) = $1)
         AS esta_referenciado`,
      [filename],
    );
    if (references.rows[0]?.esta_referenciado) {
      throw new ApiError(409, "La imagen ya está en uso y no se puede eliminar");
    }

    // Eliminar de Supabase Storage
    await deleteFromSupabase(`fotos/${filename}`).catch(() => {});

    // Eliminar de disco local si existiera
    const localFilePath = path.join(uploadDir, filename);
    await fs.promises.unlink(localFilePath).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });

    await query(
      `DELETE FROM archivos_media_subidos WHERE nombre_archivo = $1 AND id_usuario = $2`,
      [filename, req.user!.id],
    );
    sendResponse(res, 200, { filename }, "Imagen temporal eliminada");
  } catch (error) {
    next(error);
  }
});

export default router;
