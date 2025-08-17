import React from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const colorMap = {
  success: {
    container: 'bg-green-50 border-green-200',
    text: 'text-green-800',
    icon: 'text-green-400',
  },
  error: {
    container: 'bg-red-50 border-red-200',
    text: 'text-red-800',
    icon: 'text-red-400',
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    text: 'text-blue-800',
    icon: 'text-blue-400',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200',
    text: 'text-yellow-800',
    icon: 'text-yellow-400',
  },
};

export const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {notifications.map((notification) => {
        const Icon = iconMap[notification.type];
        const colors = colorMap[notification.type];
        
        return (
          <div
            key={notification.id}
            className={`
              flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm
              ${colors.container}
              transform transition-all duration-300 ease-in-out
              animate-in slide-in-from-right-full
            `}
            role="alert"
            aria-live="polite"
          >
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${colors.icon}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${colors.text} break-words`}>
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className={`
                flex-shrink-0 ml-2 p-1 rounded-md transition-colors
                ${colors.text} hover:bg-white/20
              `}
              aria-label="알림 닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};