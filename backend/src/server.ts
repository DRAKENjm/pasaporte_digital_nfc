import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes";
import { checkDatabaseConnection } from "./config/database";
import { ApiError } from "./utils";

dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
  throw new Error("JWT_SECRET debe contener al menos 32 caracteres aleatorios");
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globales
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*", credentials: true }));
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true }));

// Verificación de estado / Health Check
app.get("/health", (req: Request, res: Response) => {
  res
    .status(200)
    .json({ status: "OK", uptime: process.uptime(), timestamp: new Date() });
});

// Rutas Principales de la API
app.use("/api", routes);

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
