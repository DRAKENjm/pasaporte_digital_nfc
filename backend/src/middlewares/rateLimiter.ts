import rateLimit from "express-rate-limit";

// Rate limit estricto para autenticación (Login, Registro, Recuperación)
// Previene ataques de fuerza bruta automatizados
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Ventana de 15 minutos
  max: 10, // Máximo 10 intentos por IP en la ventana
  standardHeaders: true, // Retorna cabeceras RateLimit-* (RFC)
  legacyHeaders: false, // Desactiva cabeceras antiguas X-RateLimit-*
  statusCode: 429,
  message: {
    success: false,
    message: "Demasiados intentos de acceso desde esta dirección IP. Por favor espera 15 minutos antes de volver a intentarlo.",
    retryAfterMinutes: 15,
  },
});

// Rate limit general para la API pública
// Mitiga scrapers, DDoS ligero y saturación de conexiones concurrentes
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // Ventana de 1 minuto
  max: 120, // Máximo 120 solicitudes por minuto por IP
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    success: false,
    message: "Límite de solicitudes excedido. Por favor intenta de nuevo en un momento.",
  },
});
