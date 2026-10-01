import api from "./api";
import { VisitValidationResponse } from "../types";

export const nfcService = {
  async validarNfc(uid_nfc: string, establecimiento_id: string) {
    const res = await api.post("/nfc/validar-nfc", {
      uid_nfc,
      establecimiento_id,
    });
    return res.data.data;
  },

  async validateVisit(
    tagUid: string,
    fallbackCode?: string,
    coords?: { latitude: number; longitude: number },
  ): Promise<VisitValidationResponse> {
    const res = await api.post<VisitValidationResponse>("/nfc/validate-visit", {
      tagUid,
      fallbackCode,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
    });
    return res.data;
  },

  async getVisitHistory() {
    const res = await api.get("/nfc/historial");
    return res.data.data;
  },

  async historial() {
    return this.getVisitHistory();
  },

  async asignarTarjeta(uid_nfc: string) {
    const res = await api.post("/nfc/asignar-tarjeta", { uid_nfc });
    return res.data.data;
  },

  async autosellar(payload: {
    id_sucursal: string | number;
    latitud: number;
    longitud: number;
    foto_evidencia?: string;
    id_programa?: string | number;
  }) {
    const res = await api.post("/nfc/autosellar", payload);
    return res.data;
  },

  async identificar(payload: { uid_nfc?: string; qr_code?: string }) {
    const res = await api.post("/nfc/identificar", payload);
    return res.data;
  },
};

