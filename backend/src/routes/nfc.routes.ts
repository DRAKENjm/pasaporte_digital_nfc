import { Router } from 'express';
import { PointsController } from '../controllers/points.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/role.middleware';
import { fraudCheck } from '../middlewares/fraud.middleware';

const router = Router();

router.use(authMiddleware);
router.use(fraudCheck);

// Usuario vincula su tarjeta
router.post('/asignar-tarjeta', PointsController.asignarTarjeta);

// Historial del usuario autenticado
router.get('/historial', PointsController.historial);

// Validación (solo comercio / admin)
router.post(
  '/validar',
  requireRoles('COMERCIO', 'ADMIN'),
  PointsController.validarVisita
);

router.post(
  '/validar-nfc',
  requireRoles('COMERCIO', 'ADMIN'),
  PointsController.validarPorNfc
);

export default router;
