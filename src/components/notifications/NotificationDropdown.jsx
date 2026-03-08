import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications'; // Import hook to get loadMore
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
  const { loadMore, hasMore } = useNotifications(); // ← Get pagination controls
  const listRef = useRef(null);

  // --- STATE ---
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // --- INFINITE SCROLL ---
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // If scrolled to bottom (within 20px threshold)
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
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    // Select all currently loaded notifications
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map(n => n._id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Delete ${selectedIds.length} notifications?`)) {
      selectedIds.forEach(id => onDelete(id));
      setIsSelectionMode(false);
      setSelectedIds([]);
    }
  };

  const handleBulkMarkRead = () => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach(id => onMarkAsRead(id));
    setIsSelectionMode(false);
    setSelectedIds([]);
  };

  const hasUnread = notifications?.some(n => !n.isRead);
  const hasNotifications = notifications?.length > 0;

  return (
    <div className="notification-dropdown" role="menu">
      {/* Header (Same as before) */}
      <div className="notification-header-wrapper">
        <div className="notification-header-top">
          <h3 className="notification-dropdown-title">
            {isSelectionMode ? `${selectedIds.length} Selected` : 'Notifications'}
          </h3>
          <button className="notification-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="notification-header-actions">
          {!isSelectionMode ? (
            <>
              {hasNotifications && (
                <button className="action-link secondary" onClick={toggleSelectionMode}>
                  Select
                </button>
              )}
              <div className="action-group-right">
                {hasUnread && <button className="action-link primary" onClick={onMarkAllAsRead}>Mark all read</button>}
                {hasNotifications && <button className="action-link danger" onClick={onDeleteAll}>Clear all</button>}
              </div>
            </>
          ) : (
            <>
              <button className="action-link secondary" onClick={handleSelectAllVisible}>
                {selectedIds.length === notifications?.length ? 'Deselect All' : 'Select All'}
              </button>
              <div className="action-group-right">
                <button className="action-icon-btn check" onClick={handleBulkMarkRead} disabled={selectedIds.length === 0}>✓</button>
                <button className="action-icon-btn trash" onClick={handleBulkDelete} disabled={selectedIds.length === 0}>🗑</button>
                <button className="action-link secondary" onClick={toggleSelectionMode}>Cancel</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Body with Scroll */}
      <div 
        className="notification-dropdown-body" 
        onScroll={handleScroll} // ← Attach Scroll Listener
        ref={listRef}
      >
        {notifications?.length ? (
          <div className="notification-list">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
                onClose={onClose}
                isSelectionMode={isSelectionMode}
                isSelected={selectedIds.includes(notification._id)}
                onToggleSelect={handleToggleSelect}
              />
            ))}
            {/* Loading Indicator at Bottom */}
            {loading && hasMore && (
               <div className="notification-loading-small">
                 <span>Loading more...</span>
               </div>
            )}
          </div>
        ) : !loading ? (
          <div className="notification-empty">
             {/* SVG Icon */}
             <p>No notifications</p>
          </div>
        ) : (
          <div className="notification-loading">
            <div className="notification-spinner"></div>
            <p>Loading...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;