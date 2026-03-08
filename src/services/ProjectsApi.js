// src/services/ProjectsApi.js
import api from "./api"; // Your existing Axios instance

/**
 * ============================================================
 * FETCH DASHBOARD PROJECTS (OPTIMIZED)
 * ============================================================
 * Calls: GET /api/projects/admin/optimized/all
 * Used by: AdminProjects.jsx (Infinite Scroll)
 */
export const getOptimizedProjects = async ({ pageParam = 1, filters = {} }) => {
  try {
    const { 
      search = "", 
      type = "all", 
      status = "all", 
      lang = "en",
      limit = 10 
    } = filters;

    const response = await api.get("/projects/admin/optimized/all", {
      params: {
        page: pageParam,
        limit,
        search,
        type,
        status,
        lang
      },
    });

    // Return the full structure needed for useInfiniteQuery:
    // { success, data (array), total, totalPages, page }
    return response.data;

  } catch (error) {
    console.error("❌ Error fetching optimized projects:", error);
    throw error;
  }
};

/**
 * ============================================================
 * TOGGLE FEATURED STATUS
 * ============================================================
 * Calls: PUT /api/projects/:id
 * Used by: AdminProjects.jsx
 */
export const toggleProjectFeatured = async (id, currentStatus) => {
  try {
    const response = await api.put(`/projects/${id}`, {
      featured: !currentStatus
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error toggling featured status:", error);
    throw error;
  }
};

/**
 * ============================================================
 * DELETE PROJECT
 * ============================================================
 * Calls: DELETE /api/projects/:id
 */
export const deleteProject = async (id) => {
  try {
    const response = await api.delete(`/projects/${id}?permanent=true`);
    return response.data;
  } catch (error) {
    console.error("❌ Error deleting project:", error);
    throw error;
  }
};




/**
 * ============================================================
 * FETCH SINGLE PROJECT (Full Data for Editing)
 * ============================================================
 */
export const getProjectById = async (id) => {
  try {
    const response = await api.get(`/projects/${id}?includeAllTranslations=true`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching project details:", error);
    throw error;
  }
};

/**
 * ============================================================
 * CREATE PROJECT (With Header Fix)
 * ============================================================
 */
export const createProject = async (formData) => {
  try {
    const response = await api.post('/projects', formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // <--- FORCE THIS
      },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error creating project:", error);
    throw error;
  }
};

/**
 * ============================================================
 * UPDATE PROJECT (With Header Fix)
 * ============================================================
 */
export const updateProject = async (id, formData) => {
  try {
    const response = await api.put(`/projects/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // <--- FORCE THIS
      },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error updating project:", error);
    throw error;
  }
};