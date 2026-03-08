import api from "./api";

/**
 * ============================================================
 * FETCH DASHBOARD REVIEWS (OPTIMIZED)
 * ============================================================
 */
export const getOptimizedReviews = async ({ pageParam = 1, filters = {} }) => {
  try {
    const { 
      search = "", 
      active = "all", // "pending", "approved", "rejected", "all"
      lang = "en",
      limit = 10
    } = filters;

    // ✅ Uses new /reviews endpoint
    const response = await api.get("/reviews/admin/all", {
      params: {
        page: pageParam,
        limit,
        search,
        status: active !== 'all' ? active : undefined, // Backend expects 'status'
        lang
      },
    });

    // Normalize response for Infinite Query
    return {
      ...response.data,
      data: response.data.reviews || [] 
    };
  } catch (error) {
    console.error("❌ Error fetching optimized reviews:", error);
    throw error;
  }
};

/**
 * ============================================================
 * FETCH SINGLE REVIEW
 * ============================================================
 */
export const getReviewById = async (id) => {
  try {
    const response = await api.get(`/reviews/${id}`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching review details:", error);
    throw error;
  }
};

/**
 * ============================================================
 * UPDATE STATUS (Approve/Reject)
 * ============================================================
 */
export const updateReviewStatus = async (id, status) => {
  try {
    const response = await api.patch(`/reviews/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error("❌ Error updating status:", error);
    throw error;
  }
};

/**
 * ============================================================
 * TOGGLE ACTIVE STATE (Only for Approved Reviews)
 * ============================================================
 */
export const toggleReviewActive = async (id) => {
  try {
    const response = await api.patch(`/reviews/${id}/toggle`);
    return response.data;
  } catch (error) {
    console.error("❌ Error toggling active state:", error);
    throw error;
  }
};

/**
 * ============================================================
 * DELETE REVIEW (Hard Delete - Superadmin Only)
 * ============================================================
 */
export const deleteReview = async (id) => {
  try {
    const response = await api.delete(`/reviews/${id}`);
    return response.data;
  } catch (error) {
    console.error("❌ Error deleting review:", error);
    throw error;
  }
};