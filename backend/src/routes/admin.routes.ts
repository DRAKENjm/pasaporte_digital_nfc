import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/role.middleware';

const router = Router();

// Todo el módulo admin requiere rol ADMIN
router.use(authMiddleware, requireRoles('ADMIN'));

router.get('/dashboard', AdminController.dashboard);

// Usuarios
router.get('/usuarios', AdminController.listarUsuarios);
router.patch('/usuarios/:id/estado', AdminController.cambiarEstadoUsuario);
router.patch('/usuarios/:id/rol', AdminController.cambiarRolUsuario);

// Tarjetas NFC
router.get('/tarjetas', AdminController.listarTarjetas);
router.post('/tarjetas/stock', AdminController.registrarTarjetasStock);
router.patch('/tarjetas/:id/estado', AdminController.cambiarEstadoTarjeta);

// Moderación
router.get('/moderacion', AdminController.moderacionPendiente);
router.patch('/moderacion/publicaciones/:id', AdminController.moderarPublicacion);
router.patch('/moderacion/denuncias/:id', AdminController.resolverDenuncia);

// Recompensas y catálogos
router.post('/recompensas', AdminController.crearRecompensa);
router.get('/niveles', AdminController.listarNiveles);
router.get('/roles', AdminController.listarRoles);

export default router;
