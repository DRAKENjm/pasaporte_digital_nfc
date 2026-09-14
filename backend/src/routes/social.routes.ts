import { Router } from 'express';
import { SocialController } from '../controllers/social.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.get('/feed', authMiddleware, SocialController.getFeed);
router.post('/posts', authMiddleware, upload.single('media'), SocialController.createPost);

export default router;
