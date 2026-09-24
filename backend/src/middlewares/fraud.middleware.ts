import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { ApiError } from "../utils";

/**
 * Middleware ligero anti-fraude.
 * En producción se puede ampliar con rate-limit, geolocalización, device fingerprint, etc.
 */
export const fraudCheck = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  // Ejemplo: bloquear si no hay user agent (bot simple)
  if (!req.headers["user-agent"]) {
    return next(
      new ApiError(403, "Solicitud rechazada por política de seguridad"),
    );
  }
  next();
};
