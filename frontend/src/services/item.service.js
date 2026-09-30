import { api } from './api';

export const itemService = {
  createItem: async (data) => {
    const res = await api.post('/items', data);
    return res.data.data;
  },

  getItemById: async (id) => {
    const res = await api.get(`/items/${id}`);
    return res.data.data;
  },

  getAllItems: async (params) => {
    const res = await api.get('/items', { params });
    return res.data.data;
  },

  getMyItems: async () => {
    const res = await api.get('/items/my-items');
    return res.data.data;
  },

  updateItem: async (id, data) => {
    const res = await api.put(`/items/${id}`, data);
    return res.data.data;
  },

  deleteItem: async (id) => {
    await api.delete(`/items/${id}`);
  },

  checkAvailability: async (id, startDate, endDate) => {
    const res = await api.get(`/items/${id}/availability`, {
      params: { startDate, endDate },
    });
    return res.data.data;
  },
};
