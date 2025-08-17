import { useState } from 'react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

export const useNotification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (type: NotificationType, message: string, duration = 5000) => {
    const id = Date.now().toString();
    const notification: Notification = { id, type, message };
    
    setNotifications(prev => [...prev, notification]);

    setTimeout(() => {
      removeNotification(id);
    }, duration);

    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showSuccess = (message: string, duration?: number) => 
    addNotification('success', message, duration);

  const showError = (message: string, duration?: number) => 
    addNotification('error', message, duration);

  const showInfo = (message: string, duration?: number) => 
    addNotification('info', message, duration);

  const showWarning = (message: string, duration?: number) => 
    addNotification('warning', message, duration);

  return {
    notifications,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    removeNotification,
  };
};