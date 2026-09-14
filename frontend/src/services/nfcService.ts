import api from './api';
import { VisitValidationResponse } from '../types';

export const nfcService = {
  async validateVisit(tagUid: string, fallbackCode?: string, coords?: { latitude: number; longitude: number }): Promise<VisitValidationResponse> {
    const res = await api.post<VisitValidationResponse>('/nfc/validate-visit', {
      tagUid,
      fallbackCode,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
    });
    return res.data;
  },

  async getVisitHistory() {
    const res = await api.get('/nfc/history');
    return res.data;
  },
};
