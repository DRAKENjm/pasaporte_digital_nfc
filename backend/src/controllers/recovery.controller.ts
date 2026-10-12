import { Request, Response, NextFunction } from "express";
import { randomBytes, createHash } from "crypto";
import { query, pool } from "../config/database";
import { EmailService } from "../services/email.service";
import { ApiError, hashPassword, sendResponse } from "../utils";

const digest = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const RecoveryController = {
  /**
   * Solicitar recuperación de contraseña vía correo electrónico
   */
  async request(req: Request, res: Response, next: NextFunction) {
    try {
      const email = String(req.body.email || "")
        .trim()
        .toLowerCase();

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new ApiError(400, "Ingresa un correo electrónico válido");
      }

      const result = await query(
        "SELECT id_usuario, email, nombres FROM usuarios WHERE LOWER(email) = $1",
        [email]
      );

      if (result.rowCount && result.rowCount > 0) {
        const user = result.rows[0];
        const token = randomBytes(32).toString("hex");

        // Limpiar tokens anteriores de recuperación para este usuario
        await query(
          "DELETE FROM auth_tokens WHERE usuario_id = $1 AND purpose = 'reset'",
          [user.id_usuario]
        );

        // Guardar nuevo token válido por 30 minutos
        await query(
          "INSERT INTO auth_tokens (token_hash, usuario_id, purpose, expires_at) VALUES ($1, $2, 'reset', NOW() + INTERVAL '30 minutes')",
          [digest(token), user.id_usuario]
        );

        const clientOrigin = (process.env.CLIENT_ORIGIN || "").split(",")[0]?.trim();
        const baseUrl = process.env.FRONTEND_URL || clientOrigin || "http://localhost:5173";
        const link = `${baseUrl.replace(/\/$/, "")}/auth/recover?token=${token}`;

        console.log(`🔑 [Recuperación de Contraseña] Enlace generado para ${user.email}: ${link}`);

        // Enviar correo con plantilla estilizada de Pasaporte Digital
        await EmailService.sendMail(
          user.email,
          "Restablecer tu contraseña - Pasaporte Digital",
          `Hola ${user.nombres || ""},\n\nHemos recibido una solicitud para restablecer tu contraseña.\n\nAbre este enlace para continuar (válido por 30 minutos):\n${link}\n\nSi no realizaste esta solicitud, puedes ignorar este mensaje.\n\nSaludos,\nEl equipo de Pasaporte Digital`,
          `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #E5DACD; border-radius: 16px; background-color: #FAF8F5;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #7C0A1E; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Pasaporte Digital</h2>
              <p style="color: #8E7D7D; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Seguridad de la Cuenta</p>
            </div>
            <div style="background-color: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #EFE7DE;">
              <p style="color: #2D1A1E; font-size: 14px; font-weight: 600; margin-top: 0;">Hola ${user.nombres || ""},</p>
              <p style="color: #554447; font-size: 13.5px; line-height: 1.6;">Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Pasaporte Digital</strong>.</p>
              <div style="text-align: center; margin: 26px 0;">
                <a href="${link}" style="background-color: #7C0A1E; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 10px rgba(124, 10, 30, 0.2);">Restablecer mi Contraseña</a>
              </div>
              <p style="color: #8E7D7D; font-size: 11.5px; line-height: 1.5; margin-bottom: 0;">Este enlace de seguridad expirará en <strong>30 minutos</strong>. Si tú no realizaste esta solicitud, puedes ignorar este correo de forma segura; tu contraseña actual no será modificada.</p>
            </div>
            <p style="color: #A8988B; font-size: 11px; text-align: center; margin-top: 20px;">&copy; ${new Date().getFullYear()} Pasaporte Digital. Todos los derechos reservados.</p>
          </div>`
        );
      }

      // Por seguridad (anti-enumeración de usuarios), siempre respondemos 200 con mensaje genérico
      return sendResponse(
        res,
        200,
        null,
        "Si tu correo está registrado en el sistema, recibirás un enlace de recuperación en breve."
      );
    } catch (e) {
      next(e);
    }
  },

  /**
   * Restablecer contraseña con el token recibido
   */
  async reset(req: Request, res: Response, next: NextFunction) {
    const c = await pool.connect();
    try {
      const { token, password } = req.body;

      if (!token || typeof token !== "string" || !token.trim()) {
        throw new ApiError(400, "El token de recuperación es requerido o no es válido");
      }

      if (typeof password !== "string" || password.length < 8) {
        throw new ApiError(400, "La contraseña debe tener al menos 8 caracteres");
      }

      const hasLetters = /[a-zA-Z]/.test(password);
      const hasNumbersOrSymbols = /[\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
      if (!hasLetters || !hasNumbersOrSymbols) {
        throw new ApiError(400, "La contraseña debe incluir letras y al menos un número o símbolo");
      }

      await c.query("BEGIN");

      const tokenRecord = await c.query(
        "SELECT usuario_id FROM auth_tokens WHERE token_hash = $1 AND purpose = 'reset' AND expires_at > NOW()",
        [digest(String(token).trim())]
      );

      if (!tokenRecord.rowCount || tokenRecord.rowCount === 0) {
        throw new ApiError(400, "El enlace de recuperación es inválido o ha caducado. Por favor solicita uno nuevo.");
      }

      const usuarioId = tokenRecord.rows[0].usuario_id;
      const hashedPassword = await hashPassword(password);

      await c.query(
        "UPDATE usuarios SET password_hash = $1, fecha_actualizacion = NOW() WHERE id_usuario = $2",
        [hashedPassword, usuarioId]
      );

      // Eliminar tokens usados
      await c.query(
        "DELETE FROM auth_tokens WHERE usuario_id = $1 AND purpose = 'reset'",
        [usuarioId]
      );

      await c.query("COMMIT");

      return sendResponse(
        res,
        200,
        null,
        "Tu contraseña ha sido actualizada con éxito. Ya puedes iniciar sesión."
      );
    } catch (e) {
      await c.query("ROLLBACK");
      next(e);
    } finally {
      c.release();
    }
  },
};
