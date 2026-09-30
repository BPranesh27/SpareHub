import { api } from './api';

export const authService = {
  register: async (name, email, password, phone) => {
    const res = await api.post('/auth/register', {
      name,
      email,
      password,
      phone,
    });
    return res.data.data;
  },

  login: async (email, password) => {
    const res = await api.post('/auth/login', {
      email,
      password,
    });
    return res.data.data;
  },

  getCurrentUser: async () => {
    const res = await api.get('/users/me');
    return res.data.data;
  },

  updateProfile: async (name, phone) => {
    const res = await api.put('/users/me', {
      name,
      phone,
    });
    return res.data.data;
  },
};
