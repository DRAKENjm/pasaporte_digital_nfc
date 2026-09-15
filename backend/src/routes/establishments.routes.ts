import { Router } from 'express';
import { EstablishmentsController } from '../controllers/establishments.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/role.middleware';

const router = Router();

// Público autenticado: descubrir locales
router.get('/', authMiddleware, EstablishmentsController.listar);
router.get('/categorias', authMiddleware, EstablishmentsController.categorias);
router.get('/:id', authMiddleware, EstablishmentsController.detalle);
router.get('/:id/reglas', authMiddleware, EstablishmentsController.listarReglas);
router.get('/:id/estadisticas', authMiddleware, requireRoles('COMERCIO', 'ADMIN'), EstablishmentsController.estadisticas);

// Comercio / Admin
router.post('/', authMiddleware, requireRoles('COMERCIO', 'ADMIN'), EstablishmentsController.crear);
router.patch('/:id', authMiddleware, requireRoles('COMERCIO', 'ADMIN'), EstablishmentsController.actualizar);
router.post('/:id/reglas', authMiddleware, requireRoles('COMERCIO', 'ADMIN'), EstablishmentsController.crearRegla);
router.patch('/reglas/:reglaId', authMiddleware, requireRoles('COMERCIO', 'ADMIN'), EstablishmentsController.actualizarRegla);
router.post('/:id/personal', authMiddleware, requireRoles('COMERCIO', 'ADMIN'), EstablishmentsController.agregarPersonal);

export default router;
