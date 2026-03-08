// src/services/LoginApi.js
import api from './api'; 
import { authSync } from '../utils/authSync';

// ----------------------------------------------
// LOGIN
// ----------------------------------------------
export const adminLogin = async (email, password) => {
  try {
    // 1. Clear all local data before logging in
    localStorage.clear();
    sessionStorage.clear();

    // 2. Perform the login
    const response = await api.post('/admin/login', { email, password });
    
    // 3. ✅ Broadcast to OTHER tabs (not current tab)
    // Current tab will get updated via checkAuth() in AuthContext
    authSync.broadcast('LOGIN', { user: response.data.admin }, false);



    return response.data;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    throw error;
  }
};

// ----------------------------------------------
// LOGOUT
// ----------------------------------------------
export const logoutAdmin = async () => {
  try {
    await api.post('/admin/logout');
    
  } catch (error) {
    
  }
};

// ----------------------------------------------
// CHECK AUTH STATE
// ----------------------------------------------
export const isAuthenticated = () => {
  return false; // Force API validation
};