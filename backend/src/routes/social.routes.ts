import { Router } from 'express';
import { SocialController } from '../controllers/social.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/feed', authMiddleware, SocialController.feed);
router.post('/publicaciones', authMiddleware, SocialController.crearPublicacion);
router.post('/interacciones', authMiddleware, SocialController.reaccionar);
router.post('/upload-url', authMiddleware, SocialController.getUploadUrl);

export default router;
