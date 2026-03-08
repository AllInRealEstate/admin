import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminHeader from './components/AdminHeader';
import AdminSidebar from './components/AdminSidebar';
import { getNavigationItems } from './navigationConfig';
import './AdminLayout.css';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, admin } = useAuth();
  const location = useLocation();

  const currentUser = user || admin;

  // Get role-based navigation
  const navigationItems = getNavigationItems(currentUser?.role || 'admin');

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Detect if mobile (< 768px)
  const isMobile = window.innerWidth < 768;

  return (
    <div className="admin-layout">
      {/* Mobile Header - Only shown on mobile */}
      {isMobile && (
        <AdminHeader 
          onMenuToggle={handleToggleSidebar} 
          isSidebarOpen={isSidebarOpen}
        />
      )}

      {/* Sidebar - Always present */}
      <AdminSidebar
        isOpen={isSidebarOpen}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        onClose={handleCloseSidebar}
        navigationItems={navigationItems}
        currentUser={currentUser}
      />

      {/* Main Content */}
      <main className={`admin-main ${isCollapsed ? 'expanded' : ''}`}>
        <Outlet context={{ searchQuery: '' }} />
      </main>
    </div>
  );
};

export default AdminLayout;