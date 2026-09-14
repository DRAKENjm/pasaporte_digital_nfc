import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { query } from '../config/database';
import { sendResponse, ApiError } from '../utils';

export const RewardsController = {
  async listRewards(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const resDb = await query('SELECT * FROM rewards WHERE is_active = true ORDER BY points_cost ASC');
      sendResponse(res, 200, resDb.rows);
    } catch (error) {
      next(error);
    }
  },

  async redeemReward(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { rewardId } = req.body;
      const userId = req.user!.id;

      const rewardRes = await query('SELECT * FROM rewards WHERE id = $1 AND is_active = true', [rewardId]);
      const reward = rewardRes.rows[0];
      if (!reward) throw new ApiError(404, 'Recompensa no encontrada');
      if (reward.stock <= 0) throw new ApiError(400, 'Recompensa agotada');

      const walletRes = await query('SELECT * FROM wallets WHERE user_id = $1', [userId]);
      const wallet = walletRes.rows[0];

      if (wallet.balance < reward.points_cost) {
        throw new ApiError(400, 'Saldo de puntos insuficiente');
      }

      // Descontar puntos y reducir stock
      const redemptionCode = 'REDEEM-' + Math.random().toString(36).substring(2, 9).toUpperCase();

      await query(
        `INSERT INTO redemptions (user_id, reward_id, points_spent, redemption_code)
         VALUES ($1, $2, $3, $4)`,
        [userId, reward.id, reward.points_cost, redemptionCode]
      );

      await query(
        `INSERT INTO point_transactions (wallet_id, amount, type, description, reference_id)
         VALUES ($1, $2, 'REWARD_REDEEM', $3, $4)`,
        [wallet.id, -reward.points_cost, `Canje de ${reward.title}`, reward.id]
      );

      await query('UPDATE rewards SET stock = stock - 1 WHERE id = $1', [reward.id]);

      sendResponse(res, 200, { redemptionCode, rewardTitle: reward.title }, '¡Recompensa canjeada con éxito!');
    } catch (error) {
      next(error);
    }
  }
};
