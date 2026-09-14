import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { TransactionModel } from '../models/transaction.model';
import { ApiError } from '../utils';

export const fraudCheckMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { tagUid, fallbackCode } = req.body;

    if (!userId) {
      return next(new ApiError(401, 'Usuario no identificado'));
    }

    // Buscar tag
    const tag = await TransactionModel.findTagByUidOrCode(tagUid, fallbackCode);
    if (!tag) {
      return next(new ApiError(404, 'Punto de fidelización no reconocido'));
    }

    // Verificar última visita
    const lastVisit = await TransactionModel.getLastVisit(userId, tag.commerce_id);

    if (lastVisit) {
      const now = new Date().getTime();
      const lastTime = new Date(lastVisit.created_at).getTime();
      const diffMinutes = (now - lastTime) / (1000 * 60);

      const minAllowed = tag.min_minutes_between_visits || 60;
      if (diffMinutes < minAllowed) {
        const waitTime = Math.ceil(minAllowed - diffMinutes);
        return next(
          new ApiError(
            429,
            `Control Antifraude: Ya has sellado tu pasaporte en este local recientemente. Espera ${waitTime} minuto(s).`
          )
        );
      }
    }

    // Adjuntar datos del tag verificado
    (req as any).matchedTag = tag;
    next();
  } catch (error) {
    next(error);
  }
};
