// src/services/ProfileApi.js
//----------------------------------------------------
//  PROFILE API — Optimized for Admin Dashboard
//----------------------------------------------------

import api from "./api";

//====================================================
// GET OPTIMIZED PROFILE (NEW)
//====================================================
export const getOptimizedProfile = async () => {
  try {
    const response = await api.get("/admin/me/optimized");
    return response.data.admin;
  } catch (error) {
    console.error("❌ Error fetching optimized profile:", error);
    throw new Error(
      error.response?.data?.error || "Failed to load admin profile"
    );
  }
};
//====================================================
// GET WORKER PROFILE (local only)
//====================================================
export const getLocalWorkerProfile = () => {
  return null;
};
//====================================================
// GET LOCAL ADMIN (cached only)
//====================================================
export const getLocalAdmin = () => {
  return null;
};

//====================================================
// SYNC LOCAL STORAGE WITH FRESH OPTIMIZED DATA
//====================================================
export const refreshOptimizedProfile = async () => {
  try {
    const admin = await getOptimizedProfile();
    // We no longer write to localStorage here. 
    // The AuthContext will update its state when this is called.
    return admin;
  } catch (error) {
    console.error("❌ Error refreshing optimized profile:", error);
    throw error;
  }
};