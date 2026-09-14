import { TransactionModel } from '../models/transaction.model';
import { query } from '../config/database';

export const PointsService = {
  calculateRank(lifetimePoints: number): 'Bronce' | 'Plata' | 'Oro' | 'Diamante' {
    if (lifetimePoints >= 2500) return 'Diamante';
    if (lifetimePoints >= 1000) return 'Oro';
    if (lifetimePoints >= 300) return 'Plata';
    return 'Bronce';
  },

  async processVisitStamp(userId: string, tag: any, method: string) {
    const points = tag.points_per_visit || 50;

    // Registrar visita
    const visit = await TransactionModel.recordVisit(userId, tag.commerce_id, tag.id, method, points);

    // Obtener wallet
    let wallet = await TransactionModel.getWallet(userId);

    // Si no existe, crear
    if (!wallet) {
      const newWallet = await query(
        'INSERT INTO wallets (user_id, balance, current_level) VALUES ($1, $2, $3) RETURNING *',
        [userId, 0, 'Bronce']
      );
      wallet = newWallet.rows[0];
    }

    // Crear transacción de puntos (El trigger de PostgreSQL actualizará balance)
    await TransactionModel.addPointsTransaction(
      wallet.id,
      points,
      'VISIT_STAMP',
      `Sello por visita en ${tag.business_name}`,
      visit.id
    );

    // Recalcular nivel de rango
    const updatedLifetime = (wallet.lifetime_points || 0) + points;
    const newRank = this.calculateRank(updatedLifetime);

    if (newRank !== wallet.current_level) {
      await query('UPDATE wallets SET current_level = $1 WHERE id = $2', [newRank, wallet.id]);
    }

    return {
      pointsEarned: points,
      newBalance: wallet.balance + points,
      currentLevel: newRank,
      commerceName: tag.business_name,
    };
  }
};
