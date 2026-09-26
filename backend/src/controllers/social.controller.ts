import { Response, NextFunction } from "express";
import { PostModel } from "../models/post.model";
import { ApiError, sendResponse } from "../utils";
import { AuthenticatedRequest } from "../types";

export const SocialController = {
  async feed(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const limit = Math.min(
        100,
        Math.max(1, parseInt(String(req.query.limit || "30"), 10) || 30),
      );
      const offset = Math.max(
        0,
        parseInt(String(req.query.offset || "0"), 10) || 0,
      );
      const posts = await PostModel.feed(limit, offset, String(req.user!.id));
      sendResponse(res, 200, posts, "Feed de la comunidad");
    } catch (error) {
      next(error);
    }
  },

  async crearPublicacion(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) throw new ApiError(401, "No autenticado");
      const {
        texto_contenido,
        establecimiento_id,
        url_media,
        tipo_media,
        url_thumbnail,
        duracion_segundos,
        visibilidad,
      } = req.body;

      if (!String(texto_contenido || "").trim() && !url_media)
        throw new ApiError(400, "Escribe un texto o selecciona una imagen");
      if (String(texto_contenido || "").length > 500)
        throw new ApiError(400, "Texto demasiado largo");
      const post = await PostModel.create({
        usuario_id: String(req.user.id),
        establecimiento_id,
        texto_contenido,
        url_media,
        tipo_media,
        url_thumbnail,
        duracion_segundos,
        visibilidad,
      });

      sendResponse(res, 201, post, "Publicación creada");
    } catch (error) {
      next(error);
    }
  },

  async reaccionar(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const result = await PostModel.addInteraccion(
        id,
        String(req.user!.id),
        "REACCION",
      );
      sendResponse(res, 200, result);
    } catch (error) {
      next(error);
    }
  },
};
