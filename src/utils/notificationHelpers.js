// src/services/notificationApi.js
import api from './api';

/**
 * Notification API Service
 * Centralized notification-related API calls
 */

/**
 * Fetch paginated notifications
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 20)
 * @param {boolean} params.unreadOnly - Filter unread only (default: false)
 * @returns {Promise} - Notification list response
 */
export const getNotifications = async (params = {}) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = params;
    
    const response = await api.get('/notifications', {
      params: { page, limit, unreadOnly }
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    throw error;
  }
};

/**
 * Get unread notification count
 * @returns {Promise<number>} - Unread count
 */
export const getUnreadCount = async () => {
  try {
    const response = await api.get('/notifications/unread-count');
    return response.data?.count || 0;
  } catch (error) {
    console.error('Failed to fetch unread count:', error);
    throw error;
  }
};

/**
 * Mark a single notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise} - Updated notification
 */
export const markAsRead = async (notificationId) => {
  try {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 * @returns {Promise} - Success response
 */
export const markAllAsRead = async () => {
  try {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise} - Success response
 */
export const deleteNotification = async (notificationId) => {
  try {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete notification:', error);
    throw error;
  }
};

/**
 * Batch fetch: Get both notifications list and unread count
 * Optimized for initial load
 * @param {Object} params - Query parameters for notifications
 * @returns {Promise<Object>} - { notifications, count }
 */
export const fetchNotificationsWithCount = async (params = {}) => {
  try {
    const [notificationsRes, countRes] = await Promise.all([
      getNotifications(params),
      getUnreadCount()
    ]);

    return {
      notifications: notificationsRes.data || [],
      count: countRes,
      totalPages: notificationsRes.totalPages || 1,
      currentPage: notificationsRes.page || 1
    };
  } catch (error) {
    console.error('Failed to fetch notifications with count:', error);
    throw error;
  }
};