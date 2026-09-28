import { Request, Response, NextFunction } from "express";
import { query } from "../config/database";
import { ApiError, sendResponse } from "../utils";

const TIPOS_VALIDOS = [
  "POLITICA_PRIVACIDAD",
  "TERMINOS_CONDICIONES",
  "POLITICA_COOKIES",
  "CONSENTIMIENTO_MARKETING",
] as const;

const FALLBACK: Record<string, { titulo: string; html: string }> = {
  POLITICA_PRIVACIDAD: {
    titulo: "Política de Privacidad",
    html: "<p>Política de Privacidad de Pasaporte Digital NFC. El contenido completo se configurará desde el panel de administración.</p>",
  },
  TERMINOS_CONDICIONES: {
    titulo: "Términos y Condiciones",
    html: "<p>Términos y Condiciones de Pasaporte Digital NFC. El contenido completo se configurará desde el panel de administración.</p>",
  },
  POLITICA_COOKIES: {
    titulo: "Política de Cookies",
    html: "<p>Política de Cookies de Pasaporte Digital NFC.</p>",
  },
  CONSENTIMIENTO_MARKETING: {
    titulo: "Consentimiento de Marketing",
    html: "<p>Consentimiento de Marketing de Pasaporte Digital NFC.</p>",
  },
};

export const LegalController = {
  async getDocumento(req: Request, res: Response, next: NextFunction) {
    try {
      const raw = decodeURIComponent(String(req.params.tipo || ""))
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "_");

      if (!TIPOS_VALIDOS.includes(raw as any)) {
        throw new ApiError(400, "Tipo de documento no válido");
      }

      let row: any = null;
      try {
        const result = await query(
          `SELECT id_documento, tipo_documento, titulo, version,
                  contenido_url,
                  CASE WHEN EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = 'documentos_legales' AND column_name = 'contenido_html'
                  ) THEN contenido_html ELSE NULL END AS contenido_html,
                  fecha_publicacion, fecha_vigencia, estado
           FROM documentos_legales
           WHERE tipo_documento = $1 AND estado = 1
           ORDER BY fecha_publicacion DESC
           LIMIT 1`,
          [raw],
        );
        row = result.rows[0] || null;
      } catch {
        // Fallback si la columna contenido_html no existe aún
        try {
          const result = await query(
            `SELECT id_documento, tipo_documento, titulo, version, contenido_url,
                    fecha_publicacion, fecha_vigencia, estado
             FROM documentos_legales
             WHERE tipo_documento = $1 AND estado = 1
             ORDER BY fecha_publicacion DESC
             LIMIT 1`,
            [raw],
          );
          row = result.rows[0] || null;
        } catch {
          row = null;
        }
      }

      if (!row) {
        const fb = FALLBACK[raw];
        sendResponse(res, 200, {
          tipo_documento: raw,
          titulo: fb.titulo,
          version: "1.0",
          contenido_html: fb.html,
          contenido_url: null,
        });
        return;
      }

      sendResponse(res, 200, {
        ...row,
        contenido_html:
          row.contenido_html ||
          `<p><strong>${row.titulo}</strong></p><p>Versión ${row.version}. Documento disponible en: ${row.contenido_url || "N/A"}.</p>`,
      });
    } catch (error) {
      next(error);
    }
  },

  async listDocumentos(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await query(
        `SELECT id_documento, tipo_documento, titulo, version, fecha_publicacion, fecha_vigencia, estado
         FROM documentos_legales
         WHERE estado = 1
         ORDER BY tipo_documento, fecha_publicacion DESC`,
      );
      sendResponse(res, 200, result.rows);
    } catch (error) {
      next(error);
    }
  },
};
