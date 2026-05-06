'use client'

import { useNotifications } from '@/lib/notification-context'
import { NotificationToast } from '@/components/ui/notification-toast'

export function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications()

  return (
    <div className="fixed top-0 right-0 z-50 pointer-events-none">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className="pointer-events-auto"
          style={{
            transform: `translateY(${index * 80}px)`, // Stack notifications
            transition: 'transform 0.3s ease-out'
          }}
        >
          <NotificationToast
            id={notification.id}
            type={notification.type}
            title={notification.title}
            message={notification.message}
            icon={notification.icon}
            onClose={removeNotification}
          />
        </div>
      ))}
    </div>
  )
}