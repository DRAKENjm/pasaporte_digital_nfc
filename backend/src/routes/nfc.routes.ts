import { Router } from 'express';
import { PointsController } from '../controllers/points.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { fraudCheckMiddleware } from '../middlewares/fraud.middleware';

const router = Router();

router.post('/validate-visit', authMiddleware, fraudCheckMiddleware, PointsController.validateVisit);
router.get('/history', authMiddleware, PointsController.getHistory);
router.get('/wallet', authMiddleware, PointsController.getWallet);

export default router;
