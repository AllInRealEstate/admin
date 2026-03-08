import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../hooks/useNotifications';
import NotificationPanel from '../../../components/notifications/NotificationPanel';
import './AdminSidebar.css';

const AdminSidebar = ({
  isOpen,
  isCollapsed,
  onToggleCollapse,
  onClose,
  navigationItems,
  currentUser: currentUserProp,
}) => {

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const navigate = useNavigate();
  const { logout, user, admin } = useAuth();
  const { unreadCount } = useNotifications();

  //  support both AuthContext shapes + prop override
  const currentUser = currentUserProp || user || admin || null;

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const closeSidebarAndPanel = () => {
    setIsNotificationsOpen(false);
    onClose?.();
  };

  // ✅ FIXED: Separated Side Effects from State Setter
  const toggleNotifications = () => {
    // 1. Determine intent based on current state
    const willOpen = !isNotificationsOpen;

    // 2. Perform Side Effects (Update Parent)
    if (willOpen) {
      if (window.innerWidth <= 768) {
        // Mobile: close sidebar completely
        onClose?.();
      } else {
        // Desktop: collapse sidebar ONLY if it's currently expanded
        if (!isCollapsed) {
          onToggleCollapse?.();
        }
      }
    }

    // 3. Update Local State
    setIsNotificationsOpen(willOpen);
  };


  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'A';
  };

  //  supports real image + fallback initials
  const renderAvatar = () => {
    const img =
      currentUser?.workerProfile?.image ||
      currentUser?.image ||
      currentUser?.avatar ||
      null;

    if (img) {
      return (
        <img
          src={img}
          alt="Admin"
          className="mini-avatar-img"
        />
      );
    }

    return (
      <div className="mini-avatar-text">
        {getInitials(currentUser?.firstName, currentUser?.lastName)}
      </div>
    );
  };

  return (
    <>
      {/* Sidebar */}
      <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''} ${isOpen ? 'open' : ''}`}>

        {/* 1) USER CARD (Top) */}
        <div className="sidebar-user-section">
          <div className="user-mini-card">
            <div className="mini-avatar">
              {renderAvatar()}
            </div>

            {!isCollapsed && (
              <div className="mini-user-info">
                <div className="mini-name">
                  {currentUser?.firstName} {currentUser?.lastName}
                </div>
                <div className="mini-role">{currentUser?.role}</div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              className="user-logout-btn"
              onClick={handleLogout}
              aria-label="Logout"
              title="Logout"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          )}
        </div>

        {/* 2) NOTIFICATION */}
        <div className="sidebar-notification-section">
          <button
            className="notification-sidebar-item"
            type="button"
            onClick={toggleNotifications}
          >
            <span className="nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </span>

            {!isCollapsed && <span className="nav-text">Notifications</span>}

            {unreadCount > 0 && (
              <span className="notification-sidebar-badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}

            {isCollapsed && <span className="nav-tooltip">Notifications</span>}
          </button>
        </div>

        {/* 3) NAVIGATION */}
        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.label}</span>
              {isCollapsed && <span className="nav-tooltip">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* 4) COLLAPSE BUTTON (Bottom) — restored old style + double chevrons */}
        <div className="sidebar-footer">
          <button
            className="collapse-btn desktop-only"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isCollapsed ? (
                <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
              ) : (
                <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
              )}
            </svg>
          </button>
        </div>
      </aside>

      {/* Notification Panel (same behavior as header) */}
      <NotificationPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* Mobile Overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? 'show' : ''}`}
        onClick={closeSidebarAndPanel}
      />

    </>
  );
};

export default AdminSidebar;