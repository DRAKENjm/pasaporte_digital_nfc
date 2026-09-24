import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { EmailService } from "../services/email.service";
import { UserModel } from "../models/user.model";
import {
  ApiError,
  hashPassword,
  comparePassword,
  generateToken,
  sendResponse,
} from "../utils";
import { AuthenticatedRequest } from "../types";

export const AuthController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, nombres, apellidos, roleName } = req.body;

      if (!email || !password || !nombres || !apellidos) {
        throw new ApiError(400, "Completa todos los campos obligatorios");
      }

      if (
        ![email, password, nombres, apellidos].every(
          (v) => typeof v === "string",
        ) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !nombres.trim() ||
        !apellidos.trim()
      )
        throw new ApiError(400, "Datos de registro inválidos");
      if (password.length < 8 || password.length > 72) {
        throw new ApiError(
          400,
          "La contraseña debe tener entre 8 y 72 caracteres",
        );
      }

      const existing = await UserModel.findByEmail(email.toLowerCase().trim());
      if (existing) {
        throw new ApiError(409, "El correo electrónico ya está registrado");
      }

      const hashed = await hashPassword(password);
      const user = await UserModel.createUser(
        email.toLowerCase().trim(),
        hashed,
        nombres.trim(),
        apellidos.trim(),
        "CLIENTE",
      );

      const verifyToken = jwt.sign(
        { id: user.id, email: user.email, purpose: "verify-email" },
        process.env.JWT_SECRET!,
        { expiresIn: "1d" },
      );
      if (
        process.env.REQUIRE_EMAIL_VERIFICATION === "false" &&
        process.env.NODE_ENV !== "production"
      )
        await UserModel.verifyEmail(user.id);
      else {
        const delivery = await EmailService.sendVerificationEmail(
          user.email,
          verifyToken,
        );
        if (!delivery.success)
          throw new ApiError(
            503,
            "La cuenta se creó, pero falló el correo. Contacta al administrador para verificarla.",
          );
      }

      sendResponse(
        res,
        201,
        null,
        "Usuario registrado con éxito. Por favor, revisa tu correo electrónico para verificar tu cuenta.",
      );
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (
        typeof email !== "string" ||
        typeof password !== "string" ||
        !email ||
        !password
      ) {
        throw new ApiError(400, "Ingresa correo y contraseña");
      }

      const user = await UserModel.findByEmail(email.toLowerCase().trim());
      if (!user || (user.estado !== undefined && user.estado !== "ACTIVO")) {
        throw new ApiError(401, "Credenciales incorrectas");
      }

      const valid = await comparePassword(password, user.password_hash);
      if (!valid) {
        throw new ApiError(401, "Credenciales incorrectas");
      }

      if (user.email_verificado === false) {
        throw new ApiError(
          401,
          "Por favor, verifica tu correo electrónico para poder iniciar sesión.",
        );
      }

      // Enviar notificación de seguridad
      const ip =
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress ||
        "Desconocida";
      const device = req.headers["user-agent"] || "Desconocido";
      EmailService.sendLoginNotification(
        user.email,
        ip as string,
        device,
      ).catch((e) => console.error(e));

      if (user.estado !== undefined && user.estado !== "ACTIVO")
        throw new ApiError(403, "Cuenta bloqueada");
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.rol_nombre,
        nombres: user.nombres,
        apellidos: user.apellidos,
      });

      sendResponse(
        res,
        200,
        {
          token,
          user: {
            id: user.id,
            email: user.email,
            nombres: user.nombres,
            apellidos: user.apellidos,
            rol: user.rol_nombre,
            total_sellos: user.total_sellos,
            puntos_globales: user.puntos_globales,
            nivel: user.nivel_nombre,
            avatar_url: user.avatar_url || null,
          },
        },
        "Sesión iniciada",
      );
    } catch (error) {
      next(error);
    }
  },

  async getProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) throw new ApiError(401, "No autenticado");
      const user = await UserModel.findById(req.user.id);
      if (!user) throw new ApiError(404, "Usuario no encontrado");
      sendResponse(res, 200, user, "Perfil obtenido");
    } catch (error) {
      next(error);
    }
  },

  async googleLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { credential, idToken } = req.body;
      const tokenToVerify = credential || idToken;

      if (!tokenToVerify) {
        throw new ApiError(400, "Token de Google (credential) es requerido");
      }

      // Verificación real del token de Google
      const { verifyGoogleIdToken } =
        await import("../services/googleAuth.service");
      const profile = await verifyGoogleIdToken(tokenToVerify);

      const cleanEmail = profile.email.toLowerCase().trim();
      const assignedRole = "CLIENTE";

      let user = await UserModel.findByEmail(cleanEmail);

      if (!user) {
        const dummyHash = await hashPassword(
          `google_oauth_${Date.now()}_${Math.random()}`,
        );
        user = await UserModel.createUser(
          cleanEmail,
          dummyHash,
          profile.nombres.trim(),
          profile.apellidos.trim(),
          assignedRole,
        );
        await UserModel.verifyEmail(user.id);
        user.email_verificado = true;
      }

      if (user.estado !== undefined && user.estado !== "ACTIVO")
        throw new ApiError(403, "Cuenta bloqueada");
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.rol_nombre || assignedRole,
        nombres: user.nombres,
        apellidos: user.apellidos,
      });

      const ip =
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress ||
        "Desconocida";
      const device = req.headers["user-agent"] || "Desconocido";
      EmailService.sendLoginNotification(
        user.email,
        ip as string,
        device,
      ).catch((e) => console.error(e));

      sendResponse(
        res,
        200,
        {
          token,
          user: {
            id: user.id,
            email: user.email,
            nombres: user.nombres,
            apellidos: user.apellidos,
            rol: user.rol_nombre || assignedRole,
            total_sellos: user.total_sellos,
            puntos_globales: user.puntos_globales,
            nivel: user.nivel_nombre,
            avatar_url: user.avatar_url || null,
          },
        },
        "Sesión iniciada con Google",
      );
    } catch (error) {
      next(error);
    }
  },

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      if (!token) throw new ApiError(400, "Token de verificación requerido");

      const secret = process.env.JWT_SECRET!;
      let decoded: any;
      try {
        decoded = jwt.verify(token, secret);
      } catch (err) {
        throw new ApiError(401, "Token de verificación inválido o expirado");
      }

      if (decoded.purpose !== "verify-email")
        throw new ApiError(401, "Token incorrecto");
      const user = await UserModel.verifyEmail(decoded.id);
      if (!user) throw new ApiError(404, "Usuario no encontrado");

      sendResponse(
        res,
        200,
        null,
        "Correo electrónico verificado con éxito. Ya puedes iniciar sesión.",
      );
    } catch (error) {
      next(error);
    }
  },
};
