import nodemailer from "nodemailer";

// Mantenemos la lógica de producción lista, leyendo de las variables de entorno
const transporter = nodemailer.createTransport({
  service: "gmail", // Asumimos Gmail según tu preferencia, pero se puede configurar
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const EmailService = {
  /**
   * Envia notificación de nuevo inicio de sesión
   */
  async sendLoginNotification(
    to: string,
    ip: string,
    device: string = "Dispositivo no identificado",
  ) {
    const subject = "Nuevo inicio de sesión detectado - Pasaporte Digital";
    const text = `Hola,\n\nHemos detectado un nuevo inicio de sesión en tu cuenta.\n\nDetalles:\nIP: ${ip}\nDispositivo: ${device}\nFecha: ${new Date().toLocaleString()}\n\nSi no fuiste tú, por favor contacta al soporte de inmediato.\n\nSaludos,\nEl equipo de Pasaporte Digital`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Nuevo inicio de sesión detectado</h2>
        <p>Hola,</p>
        <p>Hemos detectado un nuevo inicio de sesión en tu cuenta de Pasaporte Digital.</p>
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>IP:</strong> ${ip}</p>
          <p><strong>Dispositivo:</strong> ${device}</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p style="color: #d9534f; font-weight: bold;">Si no fuiste tú, por favor contacta al soporte de inmediato.</p>
        <hr />
        <p style="font-size: 12px; color: #777;">El equipo de Pasaporte Digital</p>
      </div>
    `;

    return this.sendMail(to, subject, text, html);
  },

  /**
   * Envia correo de verificación con token
   */
  async sendVerificationEmail(to: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const verifyLink = `${frontendUrl}/verify-email?token=${token}`;

    const subject = "Verifica tu cuenta - Pasaporte Digital";
    const text = `Bienvenido a Pasaporte Digital.\n\nPor favor, verifica tu correo electrónico haciendo clic en el siguiente enlace:\n${verifyLink}\n\nSi no solicitaste esta cuenta, puedes ignorar este correo.`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>¡Bienvenido a Pasaporte Digital!</h2>
        <p>Para empezar a disfrutar de todas las funciones, por favor verifica tu correo electrónico haciendo clic en el botón de abajo:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyLink}" style="background-color: #CE8946; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verificar mi correo</a>
        </div>
        <p>Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
        <p style="word-break: break-all; color: #0066cc;">${verifyLink}</p>
        <hr />
        <p style="font-size: 12px; color: #777;">Si no solicitaste esta cuenta, puedes ignorar este correo.</p>
      </div>
    `;

    return this.sendMail(to, subject, text, html);
  },

  /**
   * Método interno para enviar el correo y manejar el comportamiento
   * si las variables de entorno no están configuradas (modo desarrollo simulado)
   */
  async sendMail(to: string, subject: string, text: string, html: string) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("⚠️ SMTP_USER o SMTP_PASS no están configurados.");
      console.log("SIMULANDO ENVÍO DE CORREO:");
      console.log(`Para: ${to}`);
      console.log(`Asunto: ${subject}`);
      console.log(`Cuerpo: ${text}`);
      return { simulated: true, success: true };
    }

    try {
      const info = await transporter.sendMail({
        from: `"Pasaporte Digital" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
      });
      console.log("Correo enviado: %s", info.messageId);
      return { simulated: false, success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Error al enviar correo:", error);
      // No lanzamos error para no interrumpir el flujo (por ejemplo, el login),
      // pero se podría cambiar según la criticidad
      return { simulated: false, success: false, error };
    }
  },
};
