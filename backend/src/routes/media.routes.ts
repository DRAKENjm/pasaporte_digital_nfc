import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { authMiddleware } from "../middlewares/auth.middleware";
import { sendResponse, ApiError } from "../utils";
import { AuthenticatedRequest } from "../types";

const router = Router();

const uploadDir = path.join(process.cwd(), "uploads", "fotos");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const uniqueName = `img-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: diskStorage,
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
  (req: AuthenticatedRequest, res, next) => {
    try {
      if (!req.file) {
        throw new ApiError(400, "No se ha subido ningún archivo");
      }
      const host = req.get("host");
      const protocol = req.protocol;
      const url = `${protocol}://${host}/uploads/fotos/${req.file.filename}`;
      sendResponse(
        res,
        200,
        {
          url,
          filename: req.file.filename,
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
