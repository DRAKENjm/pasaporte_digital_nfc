import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { TransactionModel } from '../models/transaction.model';
import { UserModel } from '../models/user.model';
import { sendResponse, ApiError } from '../utils';

export const PointsController = {
  // Acción ejecutada por el empleado/comercio al escanear la tarjeta del usuario
  async validateVisit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // 1. El usuario logueado que envía la petición es el personal del comercio
      const personalValidadorId = req.user!.id;
      
      // 2. Extraemos los datos que nos envía la app (el escaneo)
      // identificador: El UID de la tarjeta o el texto del QR
      // metodo: 'NFC' o 'QR'
      // establecimiento_id: El local donde se está validando
      const { identificador, metodo, establecimiento_id } = req.body; 

      if (!identificador || !metodo || !establecimiento_id) {
         throw new ApiError(400, 'Faltan datos obligatorios para la validación (identificador, metodo, establecimiento_id)');
      }

      // 3. Buscar a qué usuario le pertenece esa tarjeta física
      const tarjeta = await TransactionModel.findTarjeta(identificador, metodo);
      if (!tarjeta) {
        throw new ApiError(404, 'Tarjeta inválida, inactiva o no asignada a ningún usuario');
      }

      // 4. Buscar la regla de sellos activa para ese establecimiento
      const regla = await TransactionModel.getReglaActiva(establecimiento_id);
      if (!regla) {
        throw new ApiError(400, 'Este establecimiento no tiene reglas de sellos configuradas o activas');
      }

      // 5. Motor Antifraude: Verificar el límite diario del usuario en este local
      const visitasHoy = await TransactionModel.contarVisitasHoy(tarjeta.usuario_id, establecimiento_id);
      if (visitasHoy >= regla.limite_diario_por_usuario) {
        throw new ApiError(429, `Fraude prevenido: El usuario ya alcanzó el límite diario de ${regla.limite_diario_por_usuario} visita(s) en este local.`);
      }

      // 6. Si todo es correcto, procesar la acreditación en la base de datos
      const resultado = await TransactionModel.procesarValidacion(
        tarjeta.usuario_id,
        establecimiento_id,
        personalValidadorId,
        regla.id,
        regla.valor_puntos_por_sello,
        metodo
      );

      sendResponse(res, 200, resultado, `¡Validación exitosa! Se sumaron ${regla.valor_puntos_por_sello} puntos al usuario.`);
    } catch (error) {
      next(error);
    }
  },

  // Obtener el balance general del usuario autenticado (para la vista "Mi Pasaporte")
  async getWallet(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const usuario = await UserModel.findById(req.user!.id);
      if (!usuario) throw new ApiError(404, 'Usuario no encontrado');
      
      // Enviamos solo la información relevante a su balance de pasaporte
      sendResponse(res, 200, {
          total_sellos: usuario.total_sellos,
          puntos_globales: usuario.puntos_globales
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener la lista de comercios visitados por el usuario
  async getHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const historial = await TransactionModel.getHistorialUsuario(req.user!.id);
      sendResponse(res, 200, { historial }, 'Historial de visitas recuperado');
    } catch (error) {
      next(error);
    }
  },
};