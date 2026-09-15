import { UserModel } from '../models/user.model';
import { TransactionModel } from '../models/transaction.model';
import { ApiError } from '../utils';

export const PointsService = {
  async validarYAcreditar(params: {
    usuarioId: string;
    establecimientoId: string;
    personalValidadorId?: string | null;
    metodo: 'NFC' | 'QR' | 'MANUAL_DASHBOARD';
    ip?: string | null;
  }) {
    const regla = await TransactionModel.getReglaActiva(params.establecimientoId);
    if (!regla) {
      throw new ApiError(400, 'Este establecimiento no tiene reglas de sellos activas');
    }

    const visitasHoy = await TransactionModel.contarVisitasHoy(
      params.usuarioId,
      params.establecimientoId
    );

    if (visitasHoy >= (regla.limite_diario_por_usuario || 1)) {
      throw new ApiError(
        429,
        `Límite diario alcanzado (${regla.limite_diario_por_usuario} sello(s) por día en este local)`
      );
    }

    const puntos = regla.valor_puntos_por_sello || 10;

    const visita = await TransactionModel.registrarVisita({
      usuario_id: params.usuarioId,
      establecimiento_id: params.establecimientoId,
      personal_validador_id: params.personalValidadorId || null,
      regla_sello_id: regla.id,
      puntos_ganados: puntos,
      metodo_validacion: params.metodo,
      ip_registro: params.ip || null,
    });

    await UserModel.updatePuntosYSellos(params.usuarioId, 1, puntos);
    await UserModel.updateNivelIfNeeded(params.usuarioId);

    const usuarioActualizado = await UserModel.findById(params.usuarioId);

    return {
      visita,
      puntos_acreditados: puntos,
      usuario: usuarioActualizado,
    };
  },
};
