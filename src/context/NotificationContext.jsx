import { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { useSocketContext } from './SocketContext';
import { toast } from 'react-toastify';
import {
  fetchNotificationsWithCount,
  markAsRead as apiMarkAsRead,
  markAllAsRead as apiMarkAllAsRead,
  deleteNotification as apiDeleteNotification,
  deleteAllNotifications as apiDeleteAllNotifications
} from '../services/NotificationsApi';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const { admin } = useAuth();

  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { socket } = useSocketContext();

  // ⚡️ SMART TOAST LOGIC (Debounce/Group)
  const smartToast = useCallback((message, type = 'info', options = {}) => {
    // Use the message itself as the ID to prevent duplicates
    const toastId = typeof message === 'string' ? message : JSON.stringify(message);

    if (!toast.isActive(toastId)) {
      toast[type](message, {
        toastId, // Prevents duplicate toasts with same ID
        ...options
      });
    }
  }, []);

  // 1️⃣ Fetch Notifications (Initial or Load More)
  const loadNotifications = useCallback(async (isLoadMore = false) => {
    if (loading) return; // Prevent double fetch

    try {
      setLoading(true);
      const targetPage = isLoadMore ? page + 1 : 1;

      const { notifications: list, count, totalPages, total } = await fetchNotificationsWithCount({
        page: targetPage,
        limit: 20
      });

      if (isLoadMore) {
        setNotifications(prev => [...prev, ...list]);
        setPage(targetPage);
      } else {
        setNotifications(list);
        setPage(1);
        setTotalNotifications(total || list.length);
        
      }

      setUnreadCount(count);
      setHasMore(targetPage < totalPages);

    } catch (err) {
      console.error('Failed to fetch notifications', err);
      // Only show toast if it's a user-initiated action, not auto-fetch
      if (isLoadMore) smartToast('Failed to load more notifications', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, loading, smartToast, admin]);

  // Initial Load on Mount
  useEffect(() => {
    if (admin) {
      loadNotifications(false);
    } else {
      setNotifications([]); // Clear when logged out
      setUnreadCount(0);
    }
  }, [admin]); // Run once

  // 2️⃣ Listen for real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (payload) => {
      
      const notification = payload?.notification || payload;

      if (!notification) return;

      // Add to list immediately
      if (notification._id) {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }

      // Show Smart Toast
      const message = notification.message || notification.title || 'New notification';

      smartToast(message, 'info', {
        // If it's a clickable notification
        onClick: () => {
          if (notification._id) markAsRead(notification._id);
        }
      });
    };

    socket.on('notification', handleNewNotification);
    return () => socket.off('notification', handleNewNotification);
  }, [socket, smartToast]);

  // 3️⃣ Actions
  const markAsRead = async (notificationId) => {
    try {
      await apiMarkAsRead(notificationId);
      setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      smartToast('Failed to mark as read', 'error');
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiMarkAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      smartToast('All notifications marked as read', 'success');
    } catch (error) {
      smartToast('Failed to mark all as read', 'error');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const notification = notifications.find(n => n._id === notificationId);
      await apiDeleteNotification(notificationId);

      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      if (!notification?.isRead) setUnreadCount(prev => Math.max(0, prev - 1));

      smartToast('Notification deleted', 'success');
    } catch (error) {
      smartToast('Failed to delete notification', 'error');
    }
  };

  const deleteAllNotifications = async () => {
    try {
      await apiDeleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      smartToast('All notifications cleared', 'success');
    } catch (error) {
      smartToast('Failed to clear notifications', 'error');
    }
  };

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    totalNotifications,
    loading,
    hasMore,          // ← Exported
    loadMore: () => loadNotifications(true), // ← Exported
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
  }), [notifications, unreadCount, loading, hasMore, loadNotifications]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotificationContext must be used inside NotificationProvider');
  return ctx;
};