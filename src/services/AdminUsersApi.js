// src/services/AdminUsersApi.js

import api from './api';

// 🔍 Optimized, paginated, searchable list
export const getOptimizedAdmins = async ({ pageParam = 1, search = '' }) => {
  const response = await api.get('/admin/users/optimized/all', {
    params: {
      page: pageParam,
      limit: 20,
      search
    }
  });

  // Backend returns: { success, items, total, page, pageSize, totalPages }
  return response.data;
};

export const getAdminUser = async (id) => {
  const response = await api.get(`/admin/users/${id}`);
  // { success, data }
  return response.data.data;
};

export const createAdminUser = async (payload) => {
  const response = await api.post('/admin/users', payload);
  return response.data.data;
};

export const updateAdminUser = async (id, payload) => {
  const response = await api.put(`/admin/users/${id}`, payload);
  return response.data.data;
};

export const deleteAdminUser = async (id) => {
  await api.delete(`/admin/users/${id}`);
  return true;
};

//  Online users list (superadmin only)
export const getOnlineUsers = async () => {
  const res = await api.get('/admin/online-users');
  // backend shape: { users: [...], count, timestamp } (or similar)
  return res.data;
};

