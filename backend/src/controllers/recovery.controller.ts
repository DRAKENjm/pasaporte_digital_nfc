import { Request, Response, NextFunction } from "express";
import { randomBytes, createHash } from "crypto";
import { query, pool } from "../config/database";
import { EmailService } from "../services/email.service";
import { ApiError, hashPassword, sendResponse } from "../utils";
const digest = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export const RecoveryController = {
  async request(req: Request, res: Response, next: NextFunction) {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS)
        throw new ApiError(
          503,
          "El administrador debe configurar el servicio de correo para recuperar contraseñas",
        );
      const result = await query(
        "SELECT id,email FROM usuarios WHERE lower(email)=$1",
        [
          String(req.body.email || "")
            .trim()
            .toLowerCase(),
        ],
      );
      if (result.rowCount) {
        const token = randomBytes(32).toString("hex");
        await query(
          "INSERT INTO auth_tokens(token_hash,usuario_id,purpose,expires_at) VALUES($1,$2,'reset',now()+interval '30 minutes')",
          [digest(token), result.rows[0].id],
        );
        const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/auth/recover?token=${token}`;
        await EmailService.sendMail(
          result.rows[0].email,
          "Restablecer contraseña",
          `Abre este enlace (válido 30 minutos): ${link}`,
          `<p>Restablece tu contraseña: <a href="${link}">Continuar</a></p>`,
        );
      }
      sendResponse(
        res,
        200,
        null,
        "Si el correo existe, recibirás instrucciones",
      );
    } catch (e) {
      next(e);
    }
  },
  async reset(req: Request, res: Response, next: NextFunction) {
    const c = await pool.connect();
    try {
      if (typeof req.body.password !== "string" || req.body.password.length < 8)
        throw new ApiError(400, "Usa al menos 8 caracteres");
      await c.query("BEGIN");
      const result = await c.query(
        "DELETE FROM auth_tokens WHERE token_hash=$1 AND purpose='reset' AND expires_at>now() RETURNING usuario_id",
        [digest(String(req.body.token || ""))],
      );
      if (!result.rowCount)
        throw new ApiError(400, "Enlace inválido o caducado");
      await c.query(
        "UPDATE usuarios SET password_hash=$2,updated_at=now() WHERE id=$1",
        [result.rows[0].usuario_id, await hashPassword(req.body.password)],
      );
      await c.query(
        "DELETE FROM auth_tokens WHERE usuario_id=$1 AND purpose='reset'",
        [result.rows[0].usuario_id],
      );
      await c.query("COMMIT");
      sendResponse(res, 200, null, "Contraseña actualizada");
    } catch (e) {
      await c.query("ROLLBACK");
      next(e);
    } finally {
      c.release();
    }
  },
};
