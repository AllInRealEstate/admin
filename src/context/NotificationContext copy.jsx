import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { useSocketContext } from './SocketContext';
import { toast } from 'react-toastify';
import {
  fetchNotificationsWithCount,
  markAsRead as apiMarkAsRead,
  markAllAsRead as apiMarkAllAsRead,
  deleteNotification as apiDeleteNotification,
  deleteAllNotifications as apiDeleteAllNotifications // ← ADD THIS IMPORT
} from '../services/NotificationsApi';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { socket } = useSocketContext();

  // 1️⃣ Fetch initial notifications on mount
  useEffect(() => {
    let isMounted = true;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        
        const { notifications: list, count } = await fetchNotificationsWithCount({
          page: 1,
          limit: 20
        });

        if (!isMounted) return;

        setNotifications(list);
        setUnreadCount(count);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2️⃣ Listen for real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (payload) => {
      

      const notification = payload?.notification || payload;
      
      if (!notification) {
        console.warn('Empty notification payload');
        return;
      }

      // If it has _id, it's a database notification (personal)
      if (notification._id) {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
      
      // Show toast for both types
      const message = notification.message || notification.title || 'New notification';
      toast.info(message, {
        autoClose: 5000,
        onClick: () => {
          if (notification._id) {
            markAsRead(notification._id);
          }
        }
      });
    };

    socket.on('notification', handleNewNotification);

    return () => {
      socket.off('notification', handleNewNotification);
    };
  }, [socket]);

  // 3️⃣ Mark single notification as read
  const markAsRead = async (notificationId) => {
    try {
      await apiMarkAsRead(notificationId);

      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );

      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  // 4️⃣ Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await apiMarkAllAsRead();

      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );

      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  // 5️⃣ Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const notification = notifications.find(n => n._id === notificationId);

      await apiDeleteNotification(notificationId);

      setNotifications(prev => prev.filter(n => n._id !== notificationId));

      if (!notification?.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  // 6️⃣ Delete ALL notifications ← NEW FUNCTION
  const deleteAllNotifications = async () => {
    try {
      await apiDeleteAllNotifications();

      setNotifications([]);
      setUnreadCount(0);

      toast.success('All notifications cleared');
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  const value = useMemo(() => ({
    notifications,
    setNotifications,
    unreadCount,
    setUnreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications // ← ADD THIS
  }), [notifications, unreadCount, loading]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotificationContext must be used inside NotificationProvider');
  }
  return ctx;
};