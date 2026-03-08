// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getMe } from "../services/AdminLayoutApi"; 
import { logoutAdmin } from "../services/LoginApi";
import { useQueryClient } from "@tanstack/react-query";
import { authSync } from "../utils/authSync";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(undefined);
  const queryClient = useQueryClient();
  const isLoggingOut = useRef(false);
  const adminRef = useRef(admin);
  
  useEffect(() => {
    adminRef.current = admin;
  }, [admin]);

  const checkAuth = useCallback(async (silent = false) => {
    try {
      if (!silent) setAdmin(undefined);
      
      const data = await getMe(); 
      setAdmin(data);
    } catch (err) {
      if (err.response?.status === 401) {
        setAdmin(null);
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    checkAuth(false);
  }, [checkAuth]);

  // Heartbeat - check every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkAuth(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [checkAuth]);

  // Cross-tab sync listener
  useEffect(() => {
    const unsubscribe = authSync.subscribe((message) => {
      switch (message.type) {
        case 'LOGIN':
          checkAuth(true);
          break;

        case 'COOKIE_CHANGED':
          checkAuth(true);
          break;

        case 'LOGOUT':
          if (adminRef.current === null || isLoggingOut.current) {
            return;
          }
          setAdmin(null);
          queryClient.clear();
          window.location.href = "/admin/login";
          break;

        case 'SESSION_EXPIRED':
          if (adminRef.current === null || isLoggingOut.current) {
            return;
          }
          setAdmin(null);
          queryClient.clear();
          window.location.href = "/admin/login";
          break;

        default:
          break;
      }
    });

    return unsubscribe;
  }, [checkAuth, queryClient]);

  const login = async () => {
    await checkAuth(false);
  };

  const logout = async () => {
    if (isLoggingOut.current) {
      return;
    }

    isLoggingOut.current = true;

    try { 
      await logoutAdmin(); 
    } catch (e) {
      // Silent fail
    }

    localStorage.clear();
    setAdmin(null);
    queryClient.clear();
    authSync.broadcast('LOGOUT', {}, false);
    window.location.href = "/admin/login";
  };

  return (
    <AuthContext.Provider value={{ 
      admin, 
      loading: admin === undefined, 
      login, 
      logout, 
      refreshAuth: () => checkAuth(true) 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);