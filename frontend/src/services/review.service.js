import { api } from './api';

export const reviewService = {
  // Create a new review
  async createReview(reviewData) {
    const res = await api.post('/reviews', reviewData);
    return res.data;
  },

  // Get reviews for a booking
  async getReviewsByBooking(bookingId) {
    const res = await api.get(`/reviews/booking/${bookingId}`);
    return res.data;
  },

  // Check if current user has reviewed a booking
  async getBookingReviewStatus(bookingId) {
    const res = await api.get(`/reviews/booking/${bookingId}/status`);
    return res.data;
  },

  // Get reviews for an item
  async getReviewsByItem(itemId) {
    const res = await api.get(`/reviews/item/${itemId}`);
    return res.data;
  },

  // Get item rating summary
  async getItemRatingSummary(itemId) {
    const res = await api.get(`/reviews/item/${itemId}/summary`);
    return res.data;
  },

  // Get reviews written by user
  async getReviewsByUser(userId) {
    const res = await api.get(`/reviews/user/${userId}`);
    return res.data;
  }
};
