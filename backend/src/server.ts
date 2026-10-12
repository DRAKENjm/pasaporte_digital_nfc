import express, { Request, Response, NextFunction } from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import routes from "./routes";
import { checkDatabaseConnection, pool } from "./config/database";
import { ApiError } from "./utils";
import { apiLimiter } from "./middlewares/rateLimiter";

dotenv.config({ override: true }); // Configuración de entorno actualizada con Supabase

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
  throw new Error("JWT_SECRET debe contener al menos 32 caracteres aleatorios");
const app = express();
const PORT = process.env.PORT || 5000;

// Configuración para proxies inversos (Render, Cloudflare, etc.)
app.set("trust proxy", 1);

// Ocultar firma de Express (evita fingerprinting)
app.disable("x-powered-by");

// Cabeceras de seguridad HTTP completas con Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Permite servir imágenes /uploads a la PWA/web
    crossOriginOpenerPolicy: false, // Permite popups de OAuth de Google sin bloquear postMessage
    contentSecurityPolicy: false, // Desactivado para no romper Google Maps SDK e OAuth
  })
);

// Configuración robusta de CORS: lista blanca de orígenes permitidos
const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "https://pasaporte-nfc-backend.onrender.com",
];

const envOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envOrigins])];

app.use(
  cors({
    origin: (origin, callback) => {
      // Peticiones sin Origin (móviles nativas, server-to-server, curl o Render internal checks)
      if (!origin) return callback(null, true);

      // En desarrollo permitir orígenes locales
      if (process.env.NODE_ENV !== "production" && (origin.includes("localhost") || origin.includes("127.0.0.1"))) {
        return callback(null, origin);
      }

      // Validar si coincide con orígenes permitidos o subdominios válidos de despliegue
      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".onrender.com");

      if (isAllowed) {
        return callback(null, origin);
      }

      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset", "Retry-After"],
  })
);

// Límite estricto de cuerpo JSON a 150kb (mitiga ataques DoS por buffering excesivo en memoria)
app.use(express.json({ limit: "150kb" }));
app.use(express.urlencoded({ extended: true, limit: "150kb" }));

// Archivos estáticos subidos localmente (imágenes de locales, avatares, etc.)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Verificación de estado / Health Check Seguro (NO expone metadatos de BD ni usuarios superuser)
app.get("/health", async (req: Request, res: Response) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({
      status: "OK",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(503).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
    });
  }
});

// Rate limiting general en todas las rutas de API
app.use("/api", apiLimiter);

// Rutas Principales de la API
app.use("/api", routes);

// Manejador 404 estricto para rutas de API no encontradas (evita página HTML por defecto de Express)
app.use("/api/*", (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Ruta de API no encontrada",
  });
});

// Servir frontend compilado si existe (producción o despliegue unificado)
const frontendDistPath = path.resolve(process.cwd(), "../frontend/dist");
const localDistPath = path.resolve(process.cwd(), "frontend/dist");
const distPath = require("fs").existsSync(frontendDistPath)
  ? frontendDistPath
  : require("fs").existsSync(localDistPath)
  ? localDistPath
  : null;

if (distPath) {
  app.use(express.static(distPath));
  app.get("*", (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads") || req.path === "/health") {
      return next();
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Manejador centralizado de errores
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("[Error Pipeline]", err);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (
    err.code === "22P02" ||
    err.code === "23514" ||
    err.code === "23503" ||
    err.type === "entity.parse.failed"
  )
    return res
      .status(400)
      .json({ success: false, message: "Datos inválidos; revisa los campos" });
  if (err.code === "23505")
    return res
      .status(409)
      .json({ success: false, message: "Este registro ya existe" });
  if (err.type === "entity.too.large")
    return res
      .status(413)
      .json({
        success: false,
        message: "Archivo demasiado grande (máximo 5 MB)",
      });
  return res.status(500).json({
    success: false,
    message: "Error interno del servidor",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Inicio del Servidor
const startServer = async () => {
  if (!(await checkDatabaseConnection()))
    throw new Error(
      "Configura DATABASE_URL y aplica las migraciones antes de iniciar",
    );
  app.listen(PORT, () => {
    console.log(
      `🚀 Servidor Pasaporte NFC escuchando en http://localhost:${PORT}`,
    );
  });
};

startServer();
