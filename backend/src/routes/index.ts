import { Router } from 'express';
import authRoutes from './auth.routes';
import nfcRoutes from './nfc.routes';
import socialRoutes from './social.routes';
import rewardsRoutes from './rewards.routes';
import establishmentsRoutes from './establishments.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/nfc', nfcRoutes);
router.use('/social', socialRoutes);
router.use('/rewards', rewardsRoutes);
router.use('/establishments', establishmentsRoutes);
router.use('/admin', adminRoutes);

export default router;
