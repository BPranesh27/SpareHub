import { api } from './api';

export const analyticsService = {
  // Get summary KPIs for authenticated lender
  async getAnalyticsSummary() {
    const res = await api.get('/analytics/summary');
    return res.data;
  },

  // Get item-wise performance metrics
  async getItemPerformance() {
    const res = await api.get('/analytics/items');
    return res.data;
  },

  // Get monthly revenue trend
  async getRevenueTrend() {
    const res = await api.get('/analytics/revenue-trend');
    return res.data;
  },

  // Get top items breakdown
  async getTopItems() {
    const res = await api.get('/analytics/top-items');
    return res.data;
  }
};
