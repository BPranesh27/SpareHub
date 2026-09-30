import { api } from './api';

export const returnService = {
  requestReturn: async (bookingId) => {
    const res = await api.post(`/bookings/${bookingId}/return-request`);
    return res.data.data;
  },

  getDamageReport: async (bookingId) => {
    const res = await api.get(`/bookings/${bookingId}/damage-report`);
    return res.data.data;
  },

  submitDamageInspection: async (bookingId, damageAmount, description, imageUrls = []) => {
    const res = await api.post(`/bookings/${bookingId}/damage-report`, {
      damageAmount: Number(damageAmount),
      description,
      imageUrls,
    });
    return res.data.data;
  },

  completeReturn: async (bookingId) => {
    const res = await api.post(`/bookings/${bookingId}/complete-return`);
    return res.data.data;
  },

  getReturnSummary: async (bookingId) => {
    const res = await api.get(`/bookings/${bookingId}/return-summary`);
    return res.data.data;
  },
};
