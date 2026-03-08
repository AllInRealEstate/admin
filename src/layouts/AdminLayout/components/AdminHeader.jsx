import { useState } from 'react';
import { useNotifications } from '../../../hooks/useNotifications';
import NotificationPanel from '../../../components/notifications/NotificationPanel';
import './AdminHeader.css';

const AdminHeader = ({ onMenuToggle }) => {
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const { unreadCount } = useNotifications();

  const handleToggleNotificationPanel = () => {
    setIsNotificationPanelOpen(!isNotificationPanelOpen);
  };

  const handleCloseNotificationPanel = () => {
    setIsNotificationPanelOpen(false);
  };

  return (
    <>
      <header className="admin-mobile-header">
        {/* Menu Toggle (Left) */}
        <button 
          className="mobile-toggle" 
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Logo (Center) */}
        <div className="mobile-logo">
          <img src={"/logo-optimized.png"} alt="ALL IN" />
          <span className="brand-name">ALL IN</span>
        </div>

        {/* Notification Bell (Right) */}
        <div className="header-actions">
          <button 
            className="header-notification-btn"
            onClick={handleToggleNotificationPanel}
            aria-label="Notifications"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="header-notification-badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Notification Panel */}
      {isNotificationPanelOpen && (
        <NotificationPanel 
          isOpen={isNotificationPanelOpen}
          onClose={handleCloseNotificationPanel}
          isMobile={true}
        />
      )}
    </>
  );
};

export default AdminHeader;