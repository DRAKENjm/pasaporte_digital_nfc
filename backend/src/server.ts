import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { checkDatabaseConnection } from './config/database';
import { ApiError } from './utils';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globales
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Verificación de estado / Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime(), timestamp: new Date() });
});

// Rutas Principales de la API
app.use('/api', routes);

// Manejador centralizado de errores
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error Pipeline]', err);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Inicio del Servidor
const startServer = async () => {
  await checkDatabaseConnection();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor Pasaporte NFC escuchando en http://localhost:${PORT}`);
  });
};

startServer();
