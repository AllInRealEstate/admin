// src/services/CoursesApi.js
import api from './api';

/**
 * ============================================================
 * FETCH DASHBOARD COURSES (OPTIMIZED)
 * ============================================================
 * Calls: GET /api/courses/admin/optimized/all
 */
export const getOptimizedCourses = async ({ pageParam = 1, filters = {} }) => {
  try {
    const {
      search = '',
      active = 'all',
      lang = 'en',
      limit = 10
    } = filters;

    const response = await api.get('/courses/admin/optimized/all', {
      params: {
        page: pageParam,
        limit,
        search,
        active,
        lang
      }
    });

    // { success, data, total, totalPages, page }
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching optimized courses:', error);
    throw error;
  }
};

/**
 * ============================================================
 * FETCH SINGLE COURSE (Full Data for Edit)
 * ============================================================
 */
export const getCourseById = async (id) => {
  try {
    const response = await api.get(`/courses/${id}`, {
      params: { includeAllTranslations: true }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching course details:', error);
    throw error;
  }
};

/**
 * ============================================================
 * CREATE COURSE
 * ============================================================
 */
export const createCourse = async (formData) => {
  try {
    const response = await api.post('/courses', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error creating course:', error);
    throw error;
  }
};

/**
 * ============================================================
 * UPDATE COURSE
 * ============================================================
 */
export const updateCourse = async (id, formData) => {
  try {
    const response = await api.put(`/courses/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error updating course:', error);
    throw error;
  }
};

/**
 * ============================================================
 * DELETE COURSE
 * ============================================================
 */
export const deleteCourse = async (id) => {
  try {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error deleting course:', error);
    throw error;
  }
};
