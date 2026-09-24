import { query } from "../config/database";
import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest, AuthUser } from "../types";
import { ApiError } from "../utils";

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new ApiError(401, "Token no proporcionado");
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;

    if (!decoded.id || !decoded.role)
      throw new ApiError(401, "Token no válido para iniciar sesión");
    const current = await query(
      "SELECT u.estado,r.nombre AS role FROM usuarios u JOIN roles r ON r.id=u.rol_id WHERE u.id=$1",
      [decoded.id],
    );
    if (current.rows[0]?.estado !== "ACTIVO")
      throw new ApiError(401, "Cuenta no disponible");
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: current.rows[0].role,
      nombres: decoded.nombres,
      apellidos: decoded.apellidos,
    };
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return next(new ApiError(401, "Token expirado"));
    }
    next(new ApiError(401, "Token inválido"));
  }
};
