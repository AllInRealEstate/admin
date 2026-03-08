import { useNotificationContext } from '../context/NotificationContext';

export const useNotifications = () => {
  return useNotificationContext();
};
