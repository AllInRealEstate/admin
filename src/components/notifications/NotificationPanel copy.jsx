import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationItem from './NotificationItem';
import './NotificationPanel.css';
import { useNotifications } from '../../hooks/useNotifications';

const NotificationPanel = ({ isOpen, onClose, isMobile = false }) => {
  const panelRef = useRef(null);
const { 
    notifications, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    deleteAllNotifications,
    loadMore, 
    hasMore
  } = useNotifications();
  
  const navigate = useNavigate();

  // --- SELECTION STATE ---
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // --- DERIVED STATE ---
  const hasUnread = notifications?.some(n => !n.isRead);
  const hasNotifications = notifications?.length > 0;

  // --- INFINITE SCROLL ---
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 50) { // 50px threshold
      if (!loading && hasMore) {
        loadMore();
      }
    }
  };

  // Reset selection when panel closes
  useEffect(() => {
    if (!isOpen) {
      setIsSelectionMode(false);
      setSelectedIds([]);
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // --- HANDLERS ---
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds([]);
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map(n => n._id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Delete ${selectedIds.length} notifications?`)) {
      // Loop delete for now
      for (const id of selectedIds) {
        await deleteNotification(id);
      }
      setIsSelectionMode(false);
      setSelectedIds([]);
    }
  };

  const handleBulkMarkRead = async () => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      await markAsRead(id);
    }
    setIsSelectionMode(false);
    setSelectedIds([]);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteAll = async () => {
      await deleteAllNotifications();
  };

  return (
    <>
      <div className={`notification-panel-overlay ${isOpen ? 'show' : ''}`} onClick={onClose} />

      <div 
        ref={panelRef}
        className={`notification-panel ${isOpen ? 'open' : ''} ${isMobile ? 'mobile' : 'desktop'}`}
      >
        {/* --- HEADER WRAPPER (2 Rows) --- */}
        <div className="notification-panel-header-wrapper">
          
          {/* ROW 1: Title & Close */}
          <div className="notification-panel-header-top">
            <h3 className="notification-panel-title">
              {isSelectionMode ? `${selectedIds.length} Selected` : 'Notifications'}
            </h3>
            <button className="notification-panel-close" onClick={onClose}>✕</button>
          </div>

          {/* ROW 2: Actions Toolbar */}
          <div className="notification-panel-header-actions">
            {!isSelectionMode ? (
              // Normal Mode
              <>
                {hasNotifications ? (
                  <button className="action-link secondary" onClick={toggleSelectionMode}>
                    Select
                  </button>
                ) : <div></div>}

                <div className="action-group-right">
                  {hasUnread && (
                    <button className="action-link primary" onClick={handleMarkAllAsRead}>
                      Mark all read
                    </button>
                  )}
                  {hasNotifications && (
                    <button className="action-link danger" onClick={handleDeleteAll}>
                      Clear all
                    </button>
                  )}
                </div>
              </>
            ) : (
              // Selection Mode
              <>
                <button className="action-link secondary" onClick={handleSelectAllVisible}>
                  {selectedIds.length === notifications?.length ? 'Deselect All' : 'Select All'}
                </button>
                
                <div className="action-group-right">
                  <button 
                    className="action-icon-btn check" 
                    onClick={handleBulkMarkRead} 
                    disabled={selectedIds.length === 0}
                    title="Mark read"
                  >
                    ✓
                  </button>
                  <button 
                    className="action-icon-btn trash" 
                    onClick={handleBulkDelete} 
                    disabled={selectedIds.length === 0}
                    title="Delete"
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

        {/* --- BODY --- */}
        <div className="notification-panel-body" onScroll={handleScroll}>
          {loading ? (
            <div className="notification-panel-loading">
              <div className="spinner"></div>
              <p>Loading...</p>
            </div>
          ) : notifications?.length > 0 ? (
            <div className="notification-panel-list">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  onClose={onClose}
                  // Pass Selection Props
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedIds.includes(notification._id)}
                  onToggleSelect={handleToggleSelect}
                />
              ))}
            </div>
          ) : (
            <div className="notification-panel-empty">
              <p>No notifications yet</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;