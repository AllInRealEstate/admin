import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout/AdminLayout';
import ProtectedRoute from './utils/ProtectedRoute';

// Admin pages
import AdminLogin from './pages/admin/AdminLogin/AdminLogin';
import AdminProfile from './pages/admin/AdminProfile/AdminProfile';
import AdminProjects from './pages/admin/AdminProjects/AdminProjects';
import AdminServices from './pages/admin/AdminServices/AdminServices';
import AdminReviews from './pages/admin/AdminReviews/AdminReviews';
import AdminUsers from './pages/admin/AdminManagement/AdminManagement';
import AdminForm from './pages/admin/AdminForm/AdminForm';
import AdminTeam from './pages/admin/AdminTeam/AdminTeam';
import TeamMemberForm from './pages/admin/TeamMemberForm/TeamMemberForm';
import AdminLeads from './pages/admin/AdminLeads/LeadDashboard';
import AdminCourses from './pages/admin/AdminCourses/AdminCourses';
import CourseFormPage from './pages/admin/CourseForm/CourseFormPage';
import ProjectFormPage from './pages/admin/ProjectForm/ProjectFormPage';
import ServiceFormPage from './pages/admin/ServiceForm/ServiceFormPage';
import LeadDetailsPanel from './pages/admin/AdminLeads/LeadDetails/LeadDetailsPanel';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { NotificationProvider } from './context/NotificationContext';

// REACT QUERY
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const queryClient = new QueryClient();

function App() {

  return (

    //  1. QueryClientProvider MUST be the outer wrapper
    <QueryClientProvider client={queryClient}>


      {/*  2. AuthProvider goes inside */}
      <AuthProvider>
        {/*  3. SocketProvider goes inside AuthProvider */}
        <SocketProvider>

          <NotificationProvider>

            <>
              <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

              <Routes>

                {/* PUBLIC */}
                <Route path="/" element={<Navigate to="/admin/login" replace />} />
                <Route path="/admin/login" element={<AdminLogin />} />

                {/* PROTECTED */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminProfile />} />
                    <Route path="projects" element={<AdminProjects />} />
                    <Route path="projects/new" element={<ProjectFormPage />} />
                    <Route path="projects/:id/edit" element={<ProjectFormPage />} />

                    <Route path="services" element={<AdminServices />} />
                    <Route path="services/new" element={<ServiceFormPage />} />
                    <Route path="services/:id/edit" element={<ServiceFormPage />} />

                    <Route path="courses" element={<AdminCourses />} />
                    <Route path="courses/new" element={<CourseFormPage />} />
                    <Route path="courses/:id/edit" element={<CourseFormPage />} />

                    <Route path="reviews" element={<AdminReviews />} />

                    <Route path="users" element={<AdminUsers />} />
                    <Route path="users/new" element={<AdminForm />} />
                    <Route path="users/edit/:id" element={<AdminForm />} />

                    <Route path="team" element={<AdminTeam />} />
                    <Route path="team/new" element={<TeamMemberForm />} />
                    <Route path="team/edit/:id" element={<TeamMemberForm />} />

                    <Route path="leads" element={<AdminLeads />} />
                    <Route path="leads/:id" element={<LeadDetailsPanel />} />
                  </Route>
                </Route>

              </Routes>

            </>
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider >
    </QueryClientProvider >

  );
}

export default App;
