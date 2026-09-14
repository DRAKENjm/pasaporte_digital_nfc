import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { PostModel } from '../models/post.model';
import { MediaService } from '../services/media.service';
import { sendResponse, ApiError } from '../utils';

export const SocialController = {
  async getFeed(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const posts = await PostModel.getFeed();
      sendResponse(res, 200, posts);
    } catch (error) {
      next(error);
    }
  },

  async createPost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      const { content, commerceId, duration } = req.body;

      if (!file) {
        throw new ApiError(400, 'Debes subir un video o imagen');
      }

      const mediaUrl = await MediaService.uploadMedia(file, 'social');
      const mediaType = file.mimetype.startsWith('video') ? 'video' : 'image';

      const post = await PostModel.createPost(
        req.user!.id,
        mediaUrl,
        mediaType,
        content,
        commerceId,
        duration ? parseFloat(duration) : undefined
      );

      sendResponse(res, 201, post, 'Publicación creada exitosamente');
    } catch (error) {
      next(error);
    }
  },
};
