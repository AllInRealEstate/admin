// src/services/TestimonialsApi.js
import api from "./api";

/**
 * ============================================================
 * FETCH DASHBOARD TESTIMONIALS (OPTIMIZED)
 * ============================================================
 */
export const getOptimizedTestimonials = async ({ pageParam = 1, filters = {} }) => {
  try {
    const { 
      search = "", 
      active = "all", // Added status filter
      lang = "en",
      limit = 10
    } = filters;

    const response = await api.get("/testimonials/admin/optimized/all", {
      params: {
        page: pageParam,
        limit,
        search,
        active,
        lang
      },
    });

    return response.data;
  } catch (error) {
    console.error("❌ Error fetching optimized testimonials:", error);
    throw error;
  }
};

/**
 * ============================================================
 * FETCH SINGLE TESTIMONIAL
 * ============================================================
 */
export const getTestimonialById = async (id) => {
  try {
    const response = await api.get(`/testimonials/${id}?includeAllTranslations=true`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching testimonial details:", error);
    throw error;
  }
};

/**
 * ============================================================
 * CREATE TESTIMONIAL
 * ============================================================
 */
export const createTestimonial = async (data) => {
  try {
    const response = await api.post('/testimonials', data);
    return response.data;
  } catch (error) {
    console.error("❌ Error creating testimonial:", error);
    throw error;
  }
};

/**
 * ============================================================
 * UPDATE TESTIMONIAL
 * ============================================================
 */
export const updateTestimonial = async (id, data) => {
  try {
    const response = await api.put(`/testimonials/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("❌ Error updating testimonial:", error);
    throw error;
  }
};

/**
 * ============================================================
 * DELETE TESTIMONIAL
 * ============================================================
 */
export const deleteTestimonial = async (id) => {
  try {
    const response = await api.delete(`/testimonials/${id}`);
    return response.data;
  } catch (error) {
    console.error("❌ Error deleting testimonial:", error);
    throw error;
  }
};