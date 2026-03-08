import api from './api';

// ✅ Optimized admin list (with pagination & search support)
export const getOptimizedTeamMembers = async (params = {}) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    role,
    active
  } = params;

  const response = await api.get('/team/admin/optimized/all', {
    params: {
      page,
      limit,
      search,
      role,
      active
    }
  });

  // { success, items, total, page, pageSize, totalPages }
  return response.data;
};

//  Single team member for edit
export const getTeamMemberById = async (id) => {
  const response = await api.get(`/team/${id}?includeAllTranslations=true`);
  return response.data;
};

//  Create team member (multipart/form-data)
export const createTeamMember = async (formData) => {
  const response = await api.post('/team', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};


// Uses PUT /team/:id which matches the backend route
export const updateTeamMember = async (id, formData) => {
  const response = await api.put(`/team/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

//  Delete team member (also deletes image in backend)
export const deleteTeamMember = async (id) => {
  const response = await api.delete(`/team/${id}`);
  return response.data;
};


export const getAllTeamMembers = async () => {
  // We set a high limit to ensure we get everyone for the dropdown
  const data = await getOptimizedTeamMembers({ limit: 100 });
  
  // The API returns { items: [...] }, but the Form expects just the Array [...]
  return data.items;
};