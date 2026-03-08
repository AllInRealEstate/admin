import { useNavigate } from 'react-router-dom';
import './NotificationItem.css';

const formatRelativeTime = (isoDate) => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  const diff = Date.now() - date.getTime();

  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'Just now';

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;

  const day = Math.floor(hr / 24);
  return `${day}d ago`;
};

const NotificationItem = ({ 
  notification, 
  onMarkAsRead, 
  onDelete, 
  onClose,
  // Selection Props
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect
}) => {
  const navigate = useNavigate();
  const isUnread = !notification?.isRead;

  const handleNotificationClick = async () => {
    // If in selection mode, toggle checkbox instead of navigating
    if (isSelectionMode) {
      onToggleSelect(notification._id);
      return;
    }

    // Mark as read if unread
    if (isUnread && onMarkAsRead) {
      await onMarkAsRead(notification._id);
    }

    // Navigate to lead if leadId exists
    if (notification?.data?.leadId) {
      navigate(`/admin/leads/${notification.data.leadId}`);
      
      // Close dropdown after navigation
      if (onClose) {
        onClose();
      }
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation(); // Prevent triggering notification click
    
    if (onDelete) {
      await onDelete(notification._id);
    }
  };

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    onToggleSelect(notification._id);
  };

  return (
    <div 
      className={`notification-item ${isUnread ? 'unread' : ''} ${isSelectionMode ? 'selection-mode' : ''}`}
      role="menuitem"
      onClick={handleNotificationClick}
    >
      {/* Checkbox (Selection Mode Only) */}
      {isSelectionMode && (
        <div className="notification-checkbox-wrapper">
          <input
            type="checkbox"
            className="notification-checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Unread Dot (Normal Mode Only) */}
      {!isSelectionMode && isUnread && <div className="notification-dot" />}

      {/* Content */}
      <div className="notification-content">
        <div className="notification-title">{notification?.title || 'Notification'}</div>
        <div className="notification-message">{notification?.message || ''}</div>
        <div className="notification-time">
          {formatRelativeTime(notification?.createdAt)}
        </div>
      </div>

      {/* Delete Button (Normal Mode Only) */}
      {!isSelectionMode && (
        <button
          className="notification-delete-btn"
          onClick={handleDelete}
          aria-label="Delete notification"
          title="Delete"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default NotificationItem;