import { Router } from 'express';
import authRoutes from './auth.routes';
import nfcRoutes from './nfc.routes';
import socialRoutes from './social.routes';
import { RewardsController } from '../controllers/rewards.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use('/auth', authRoutes);
router.use('/nfc', nfcRoutes);
router.use('/social', socialRoutes);

// Recompensas
router.get('/rewards', authMiddleware, RewardsController.listRewards);
router.post('/rewards/redeem', authMiddleware, RewardsController.redeemReward);

export default router;
