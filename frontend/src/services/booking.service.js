import { api } from './api';

export const bookingService = {
  createBooking: async (data) => {
    const res = await api.post('/bookings', data);
    return res.data.data;
  },

  getBookingById: async (id) => {
    const res = await api.get(`/bookings/${id}`);
    return res.data.data;
  },

  getMyRentals: async () => {
    const res = await api.get('/bookings/my-rentals');
    return res.data.data;
  },

  getMyLendingBookings: async () => {
    const res = await api.get('/bookings/my-lending');
    return res.data.data;
  },

  cancelBooking: async (id) => {
    const res = await api.put(`/bookings/${id}/cancel`);
    return res.data.data;
  },
};
