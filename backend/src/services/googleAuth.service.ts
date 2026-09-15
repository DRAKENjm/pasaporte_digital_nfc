import { OAuth2Client } from 'google-auth-library';
import { ApiError } from '../utils';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface GoogleProfile {
  googleId: string;
  email: string;
  nombres: string;
  apellidos: string;
  picture?: string;
  emailVerified: boolean;
}

/**
 * Verifica el id_token (credential) que envía el frontend de Google Identity Services.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new ApiError(500, 'GOOGLE_CLIENT_ID no está configurado en el servidor');
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new ApiError(401, 'Token de Google inválido');
    }

    if (payload.email_verified === false) {
      throw new ApiError(401, 'El correo de Google no está verificado');
    }

    const given = payload.given_name || payload.name?.split(' ')[0] || 'Usuario';
    const family =
      payload.family_name ||
      payload.name?.split(' ').slice(1).join(' ') ||
      'Google';

    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase(),
      nombres: given,
      apellidos: family,
      picture: payload.picture,
      emailVerified: true,
    };
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(401, 'No se pudo verificar la cuenta de Google');
  }
}
