import { api } from './api';

export const handoverService = {
  getOrCreateHandover: async (bookingId) => {
    const res = await api.get(`/handovers/booking/${bookingId}`);
    return res.data.data;
  },

  verifyHandover: async (data) => {
    const res = await api.post('/handovers/verify', data);
    return res.data.data;
  },

  getHandoverStatus: async (bookingId) => {
    const res = await api.get(`/handovers/status/${bookingId}`);
    return res.data.data;
  },
};
