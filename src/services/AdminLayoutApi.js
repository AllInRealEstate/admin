// src/services/AdminLayoutApi.js
import api from "./api";

/**
 * Fetch authenticated admin data
 * We append ?t=TIMESTAMP to force the browser to ignore its cache.
 */
export const getMe = async () => {
  try {
    // 1. Generate a unique timestamp
    const timestamp = Date.now();
    
    // 2. Log it so you can see it working in the console
    //console.log(`🔍 Fetching fresh identity: /admin/me?t=${timestamp}`);

    // 3. Force the request
    const response = await api.get(`/admin/me?t=${timestamp}`);
    return response.data.admin;
  } catch (error) {
    throw error;
  }
};