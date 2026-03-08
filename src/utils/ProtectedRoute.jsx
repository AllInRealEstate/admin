// src/utils/ProtectedRoute.jsx

// ==================== OLD CODE ====================
// if (loading || admin === undefined) return null;
// ==================== EXPLANATION ====================
// The logic was effectively correct, but I'm explicitly adding a loading spinner here
// to match the AdminLayout style if needed, though strictly returning null is fine too.
// I will keep it clean.

// ==================== NEW CODE ====================
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
  const { admin, loading } = useAuth();

  // Wait for the cookie check to finish
  if (loading) return null; // or a spinner

  // If check finished and no admin, redirect
  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;