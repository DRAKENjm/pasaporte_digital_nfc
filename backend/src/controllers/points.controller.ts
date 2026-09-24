import { Response, NextFunction } from "express";
import { PointsService } from "../services/points.service";
import { TransactionModel } from "../models/transaction.model";
import { ApiError, sendResponse } from "../utils";
import { AuthenticatedRequest } from "../types";

export const PointsController = {
  /** Comercio o admin valida una visita (NFC / QR / manual) */
  async validarVisita(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) throw new ApiError(401, "No autenticado");

      const {
        usuario_id,
        establecimiento_id,
        metodo = "MANUAL_DASHBOARD",
      } = req.body;

      if (!usuario_id || !establecimiento_id) {
        throw new ApiError(
          400,
          "usuario_id y establecimiento_id son obligatorios",
        );
      }

      const result = await PointsService.validarYAcreditar({
        usuarioId: usuario_id,
        establecimientoId: establecimiento_id,
        personalValidadorId: req.user.id,
        metodo: "MANUAL_DASHBOARD",
        ip: req.ip,
      });

      sendResponse(res, 200, result, "Sello acreditado correctamente");
    } catch (error) {
      next(error);
    }
  },

  /** Usuario presenta su tarjeta NFC / QR y el comercio confirma */
  async validarPorNfc(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) throw new ApiError(401, "No autenticado");

      const { uid_nfc, establecimiento_id } = req.body;
      if (!uid_nfc || !establecimiento_id) {
        throw new ApiError(
          400,
          "uid_nfc y establecimiento_id son obligatorios",
        );
      }

      const tarjeta = await TransactionModel.findTarjetaByUid(uid_nfc);
      if (!tarjeta || !tarjeta.usuario_id) {
        throw new ApiError(
          404,
          "Tarjeta no encontrada o no asignada a un usuario",
        );
      }
      if (tarjeta.estado === "BLOQUEADA" || tarjeta.estado === "EXTRAVIADA") {
        throw new ApiError(403, "Tarjeta bloqueada o extraviada");
      }

      const result = await PointsService.validarYAcreditar({
        usuarioId: tarjeta.usuario_id,
        establecimientoId: establecimiento_id,
        personalValidadorId: req.user.id,
        metodo: "NFC",
        ip: req.ip,
      });

      sendResponse(res, 200, result, "Visita validada por NFC");
    } catch (error) {
      next(error);
    }
  },

  async historial(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) throw new ApiError(401, "No autenticado");
      const rows = await TransactionModel.historialUsuario(req.user.id);
      sendResponse(res, 200, rows, "Historial de sellos");
    } catch (error) {
      next(error);
    }
  },

  async asignarTarjeta(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) throw new ApiError(401, "No autenticado");
      const { uid_nfc, qr_respaldo } = req.body;
      if (!uid_nfc) throw new ApiError(400, "uid_nfc es obligatorio");

      const qr = qr_respaldo || `https://pasaporte.nfc/r/${uid_nfc}`;
      const tarjeta = await TransactionModel.asignarTarjeta(
        uid_nfc,
        req.user.id,
        qr,
      );
      if (!tarjeta)
        throw new ApiError(
          409,
          "La tarjeta ya está vinculada o no está disponible",
        );
      sendResponse(res, 200, tarjeta, "Tarjeta NFC vinculada");
    } catch (error) {
      next(error);
    }
  },
};
