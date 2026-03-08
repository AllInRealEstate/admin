import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationItem from './NotificationItem';
import './NotificationPanel.css';

const NotificationPanel = ({ isOpen, onClose, isMobile = false }) => {
  const panelRef = useRef(null);

  // 1️⃣ CHANGE: Destructure 'loadMore' and 'hasMore'
  const {
    notifications,
    totalNotifications,
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
  const [isSelectAllMode, setIsSelectAllMode] = useState(false);

  // --- DERIVED STATE ---
  const hasUnread = notifications?.some(n => !n.isRead);
  const hasNotifications = notifications?.length > 0;

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

  // 2️⃣ CHANGE: Add Scroll Handler
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Trigger load when within 20px of bottom
    if (scrollHeight - scrollTop <= clientHeight + 20) {
      if (!loading && hasMore) {
        loadMore();
      }
    }
  };


  // --- HANDLERS ---
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds([]);
    setIsSelectAllMode(false); // ← ADDED: Reset mode when toggling
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
      setIsSelectAllMode(false);
    } else {
      setSelectedIds(notifications.map(n => n._id));
    }
  };

  //  ADDED: The missing function causing your crash
  const handleSelectAllDB = () => {
    setIsSelectAllMode(true);
    // Keep visible IDs selected for UI consistency
    setSelectedIds(notifications.map(n => n._id));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0 && !isSelectAllMode) return;

    const count = isSelectAllMode ? totalNotifications : selectedIds.length;
      if (isSelectAllMode) {
        await deleteAllNotifications(); // Global nuclear option
      } else {
        for (const id of selectedIds) {
          await deleteNotification(id);
        }
      setIsSelectionMode(false);
      setSelectedIds([]);
      setIsSelectAllMode(false);
    }
  };

  const handleBulkMarkRead = async () => {
    if (selectedIds.length === 0 && !isSelectAllMode) return;

    if (isSelectAllMode) {
      await markAllAsRead(); // Optimized global action
    } else {
      for (const id of selectedIds) {
        await markAsRead(id);
      }
    }
    setIsSelectionMode(false);
    setSelectedIds([]);
    setIsSelectAllMode(false);
  };

  const handleDeleteAll = async () => {
      await deleteAllNotifications();
  };
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  return (
    <>
      <div className={`notification-panel-overlay ${isOpen ? 'show' : ''}`} onClick={onClose} />

      <div
        ref={panelRef}
        className={`notification-panel ${isOpen ? 'open' : ''} ${isMobile ? 'mobile' : 'desktop'}`}
      >
        {/* --- HEADER WRAPPER --- */}
        <div className="notification-panel-header-wrapper">
          <div className="notification-panel-header-top">
            <h3 className="notification-panel-title">
              {isSelectionMode ? (
                isSelectAllMode ? `${totalNotifications} Selected` : `${selectedIds.length} Selected`
              ) : (
                'Notifications'
              )}
            </h3>
            <button className="notification-panel-close" onClick={onClose}>✕</button>
          </div>

          <div className="notification-panel-header-actions">
            {!isSelectionMode ? (
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

        {/* --- BODY (3️⃣ CHANGE: Updated Loading Logic & onScroll) --- */}
        <div className="notification-panel-body" onScroll={handleScroll}>
          {/* --- SELECT ALL BANNER (Mirroring Leads Logic) --- */}
          {isSelectionMode && !isSelectAllMode && selectedIds.length > 0 &&
            selectedIds.length === notifications.length && totalNotifications > notifications.length && (
              <div className="selection-banner" onClick={handleSelectAllDB}>
                All {notifications.length} notifications on this page selected.
                <strong>Select all {totalNotifications} notifications</strong>
              </div>
            )}

          {isSelectAllMode && (
            <div className="selection-banner database">
              All {totalNotifications} notifications in database selected.
              <span onClick={() => { setSelectedIds([]); setIsSelectAllMode(false); }}>
                Clear selection
              </span>
            </div>
          )}
          {/* Show Big Loader ONLY if initial load (no data yet) */}
          {loading && notifications.length === 0 ? (
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
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedIds.includes(notification._id)}
                  onToggleSelect={handleToggleSelect}
                />
              ))}

              {/* Show Small Loader when scrolling for more */}
              {loading && hasMore && (
                <div className="notification-loading-small">
                  <div className="spinner-small"></div>
                </div>
              )}
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