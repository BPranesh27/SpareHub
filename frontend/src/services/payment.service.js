import { api } from './api';

export const paymentService = {
  processPayment: async (data) => {
    const res = await api.post('/payments/process', data);
    return res.data.data;
  },

  getPaymentHistory: async () => {
    const res = await api.get('/payments/history');
    return res.data.data;
  },

  getBookingPayment: async (bookingId) => {
    const res = await api.get(`/payments/booking/${bookingId}`);
    return res.data.data;
  },
};
