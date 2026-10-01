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
    titulo: "Política de Privacidad y Protección de Datos",
    html: `
      <h3>1. Marco Normativo y Responsable del Tratamiento</h3>
      <p>En cumplimiento con la <strong>Ley N° 29733 (Ley de Protección de Datos Personales del Perú)</strong> y su Reglamento aprobado por D.S. N° 003-2013-JUS, se informa a los usuarios que los datos personales recabados a través de la plataforma <strong>Pasaporte Digital NFC</strong> serán incorporados en nuestros bancos de datos automatizados con altos estándares de seguridad técnica y organizativa.</p>

      <h3>2. Datos Personales Obtenidos</h3>
      <p>Podemos recopilar los siguientes datos necesarios para la prestación del servicio:</p>
      <ul>
        <li>Datos de identificación: nombres, apellidos, tipo y número de documento (DNI/CE/Pasaporte).</li>
        <li>Datos de contacto: correo electrónico, número telefónico.</li>
        <li>Datos transaccionales y de fidelización: historial de visitas, sellos digitales acumulados, puntos acumulados y canjes realizados en establecimientos afiliados.</li>
        <li>Identificadores NFC: código único serial asociado a su pulsera o credencial física NFC.</li>
      </ul>

      <h3>3. Finalidad del Tratamiento</h3>
      <p>Sus datos personales se utilizarán estrictamente para:</p>
      <ul>
        <li>Registrar y acreditar visitas mediante escaneo NFC en comercios participantes.</li>
        <li>Emitir y certificar sellos digitales oficiales en su pasaporte virtual.</li>
        <li>Gestionar la redención de recompensas y beneficios en locales afiliados.</li>
        <li>Atención de requerimientos, quejas y reclamos en el Libro de Reclamaciones virtual.</li>
        <li>Envío de notificaciones de saldo, ascensos de nivel y beneficios exclusivos (previo consentimiento).</li>
      </ul>

      <h3>4. Ejercicio de Derechos ARCO</h3>
      <p>Usted puede ejercer en cualquier momento sus derechos de <strong>Acceso, Rectificación, Cancelación y Oposición (ARCO)</strong>, dirigiendo una comunicación escrita al correo electrónico de soporte o a través de la sección de contacto de la aplicación, adjuntando copia de su documento de identidad.</p>

      <h3>5. Confidencialidad y Seguridad</h3>
      <p>Adoptamos medidas de cifrado, controles de acceso restringido y copias de seguridad continuas para evitar cualquier alteración, pérdida o acceso no autorizado a su información personal.</p>
    `,
  },
  TERMINOS_CONDICIONES: {
    titulo: "Términos y Condiciones Generales de Uso",
    html: `
      <h3>1. Aceptación y Objeto</h3>
      <p>Los presentes Términos y Condiciones regulan el acceso y uso de la plataforma digital y red <strong>Pasaporte Digital NFC</strong>. Al crear una cuenta o utilizar una credencial/tarjeta NFC asociada, usted declara ser mayor de edad o contar con la debida representación legal, y acepta someterse íntegramente a estas condiciones.</p>

      <h3>2. Cuenta de Usuario y Credencial NFC</h3>
      <p>La cuenta es personal e intransferible. La tarjeta o pulsera física NFC es un medio de identificación rápida en el punto de venta. En caso de pérdida, sustracción o deterioro de la tarjeta física, los sellos, puntos y recompensas acumulados se encuentran respaldados en su cuenta en la nube, pudiendo vincular una nueva credencial.</p>

      <h3>3. Sistema de Sellos Digitales y Puntos</h3>
      <ul>
        <li>Los sellos son otorgados única y exclusivamente mediante validación presencial en los puntos de venta de los comercios afiliados autorizados.</li>
        <li>Cada establecimiento fija las metas de sellos requeridas para acceder a sus beneficios o premios oficiales.</li>
        <li>Queda prohibida cualquier alteración técnica, fraude o intento de duplicación de sellos por medios no autorizados, siendo causal de cancelación inmediata de la cuenta.</li>
      </ul>

      <h3>4. Canje de Recompensas</h3>
      <p>Las recompensas están sujetas a disponibilidad y stock en cada comercio afiliado. El canje debe realizarse presentando su credencial NFC o código QR de validación en el establecimiento emisor.</p>

      <h3>5. Libro de Reclamaciones</h3>
      <p>De conformidad con la <strong>Ley N° 29571 (Código de Protección y Defensa del Consumidor del Perú)</strong>, ponemos a su disposición nuestro Libro de Reclamaciones Virtual en la aplicación para formular cualquier queja o reclamo con plazo legal de respuesta.</p>

      <h3>6. Jurisdicción y Ley Aplicable</h3>
      <p>Estos términos se rigen por las leyes de la República del Perú. Cualquier controversia será resuelta ante los jueces y tribunales competentes de la ciudad de Lima.</p>
    `,
  },
  POLITICA_COOKIES: {
    titulo: "Política de Cookies y Tecnologías Similares",
    html: `
      <p>Utilizamos cookies y almacenamiento local (LocalStorage) estrictamente necesarios para mantener su sesión iniciada, recordar sus preferencias de idioma y garantizar la seguridad de sus transacciones en el Pasaporte Digital.</p>
    `,
  },
  CONSENTIMIENTO_MARKETING: {
    titulo: "Consentimiento de Comunicaciones Comerciales",
    html: `
      <p>Autorizo el envío de notificaciones y novedades sobre ofertas y recompensas de locales afiliados a través de correo electrónico o alertas en la aplicación.</p>
    `,
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
        row = null;
      }

      const fb = FALLBACK[raw] || {
        titulo: "Documento Legal",
        html: "<p>Contenido legal disponible en la plataforma.</p>",
      };

      // Si existe contenido_html personalizado en DB por el administrador, se usa ese; si no, se usa el fallback formal
      const contenidoHtml =
        row?.contenido_html && row.contenido_html.trim().length > 30
          ? row.contenido_html
          : fb.html;

      sendResponse(res, 200, {
        id_documento: row?.id_documento || null,
        tipo_documento: raw,
        titulo: row?.titulo || fb.titulo,
        version: row?.version || "1.0",
        contenido_html: contenidoHtml,
        contenido_url: row?.contenido_url || null,
        fecha_vigencia: row?.fecha_vigencia || new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async listDocumentos(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await query(
        `SELECT id_documento, tipo_documento, titulo, version, contenido_html, fecha_publicacion, fecha_vigencia, estado
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
