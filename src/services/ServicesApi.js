// src/services/ServicesApi.js
import api from "./api"; // Your Axios instance

/**
 * ============================================================
 * FETCH DASHBOARD SERVICES (OPTIMIZED)
 * ============================================================
 * Calls: GET /api/services/admin/optimized/all
 */
export const getOptimizedServices = async ({ pageParam = 1, filters = {} }) => {
  try {
    const { 
      search = "", 
      active = "all", 
      lang = "en",
      limit = 10 
    } = filters;

    const response = await api.get("/services/admin/optimized/all", {
      params: {
        page: pageParam,
        limit,
        search,
        active,
        lang
      },
    });

    return response.data; // { success, data, total, totalPages, page }
  } catch (error) {
    console.error("❌ Error fetching optimized services:", error);
    throw error;
  }
};

/**
 * ============================================================
 * FETCH SINGLE SERVICE (Full Data)
 * ============================================================
 */
export const getServiceById = async (id) => {
  try {
    const response = await api.get(`/services/${id}?includeAllTranslations=true`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching service details:", error);
    throw error;
  }
};

/**
 * ============================================================
 * CREATE SERVICE
 * ============================================================
 */
export const createService = async (formData) => {
  try {
    const response = await api.post('/services', formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // <--- Force correct header
      },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error creating service:", error);
    throw error;
  }
};

/**
 * ============================================================
 * UPDATE SERVICE
 * ============================================================
 */
export const updateService = async (id, formData) => {
  try {
    const response = await api.put(`/services/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // <--- Force correct header
      },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error updating service:", error);
    throw error;
  }
};

/**
 * ============================================================
 * DELETE SERVICE
 * ============================================================
 */
export const deleteService = async (id) => {
  try {
    const response = await api.delete(`/services/${id}`);
    return response.data;
  } catch (error) {
    console.error("❌ Error deleting service:", error);
    throw error;
  }
};