import { useState } from 'react';
import NotificationItem from './NotificationItem';
import './NotificationDropdown.css';

const NotificationDropdown = ({ 
  isOpen, 
  notifications, 
  loading, 
  onClose, 
  onMarkAllAsRead,
  onMarkAsRead,
  onDelete,
  onDeleteAll
}) => {
  // --- STATE ---
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // --- DERIVED STATE ---
  const hasUnread = notifications?.some(n => !n.isRead);
  const hasNotifications = notifications?.length > 0;

  // --- HANDLERS ---
  
  // Toggle Selection Mode
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds([]); // Reset selection when toggling
  };

  // Handle Individual Checkbox
  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id) 
        : [...prev, id]
    );
  };

  // Handle "Select All" inside selection mode
  const handleSelectAllVisible = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map(n => n._id));
    }
  };

  // Bulk Delete
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Delete ${selectedIds.length} notifications?`)) {
      // Loop for now (Backend Task will optimize this later)
      selectedIds.forEach(id => onDelete(id));
      setIsSelectionMode(false);
      setSelectedIds([]);
    }
  };

  // Bulk Mark Read
  const handleBulkMarkRead = () => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach(id => onMarkAsRead(id));
    setIsSelectionMode(false);
    setSelectedIds([]);
  };

  return (
    <div className="notification-dropdown" role="menu">
      
      {/* --- HEADER SECTION --- */}
      <div className="notification-header-wrapper">
        
        {/* ROW 1: Title & Close */}
        <div className="notification-header-top">
          <h3 className="notification-dropdown-title">
            {isSelectionMode ? `${selectedIds.length} Selected` : 'Notifications'}
          </h3>
          <button
            type="button"
            className="notification-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* ROW 2: Actions Toolbar */}
        <div className="notification-header-actions">
          
          {!isSelectionMode ? (
            // Normal Actions
            <>
              {hasNotifications && (
                <button className="action-link secondary" onClick={toggleSelectionMode}>
                  Select
                </button>
              )}
              <div className="action-group-right">
                {hasUnread && (
                  <button className="action-link primary" onClick={onMarkAllAsRead}>
                    Mark all read
                  </button>
                )}
                {hasNotifications && (
                  <button className="action-link danger" onClick={onDeleteAll}>
                    Clear all
                  </button>
                )}
              </div>
            </>
          ) : (
            // Selection Actions
            <>
              <button className="action-link secondary" onClick={handleSelectAllVisible}>
                {selectedIds.length === notifications?.length ? 'Deselect All' : 'Select All'}
              </button>
              
              <div className="action-group-right">
                <button 
                  className="action-icon-btn check" 
                  onClick={handleBulkMarkRead} 
                  disabled={selectedIds.length === 0}
                  title="Mark selected as read"
                >
                  ✓
                </button>
                <button 
                  className="action-icon-btn trash" 
                  onClick={handleBulkDelete} 
                  disabled={selectedIds.length === 0}
                  title="Delete selected"
                >
                  🗑
                </button>
                <button className="action-link secondary" onClick={toggleSelectionMode}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* --- BODY SECTION --- */}
      <div className="notification-dropdown-body">
        {loading ? (
          <div className="notification-loading">
            <div className="notification-spinner"></div>
            <p>Loading...</p>
          </div>
        ) : notifications?.length ? (
          <div className="notification-list">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
                onClose={onClose}
                // Selection Props
                isSelectionMode={isSelectionMode}
                isSelected={selectedIds.includes(notification._id)}
                onToggleSelect={handleToggleSelect}
              />
            ))}
          </div>
        ) : (
          <div className="notification-empty">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <p>No notifications</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;