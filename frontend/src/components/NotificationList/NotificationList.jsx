import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { NotificationContext } from '../../context/NotificationContext'
import NotificationItem from '../NotificationItem/NotificationItem'
import { BellOff } from 'lucide-react'
import './NotificationList.css'

const NotificationList = () => {
  const { notifications, deleteNotification, clearAll, loading } = useContext(NotificationContext)
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="notification-list-container">
        <div className="notifications-loading">Cargando notificaciones...</div>
      </div>
    )
  }

  // Filter only non-dismissed notifications and limit to most recent 3
  const activeNotifications = notifications.filter(n => !n.read)
  const recentNotifications = activeNotifications.slice(0, 3)

  if (activeNotifications.length === 0) {
    return (
      <div className="notification-list-container">
        <div className="notification-list-header">
          <span>Notificaciones</span>
        </div>
        <div className="notifications-empty">
          <BellOff size={32} />
          <p>No tienes notificaciones</p>
        </div>
      </div>
    )
  }

  return (
    <div className="notification-list-container">
      <div className="notification-list-header">
        <span>Notificaciones ({activeNotifications.length})</span>
        <button onClick={clearAll} className="clear-all-btn">Limpiar todo</button>
      </div>
      <div className="notification-items-wrapper">
        {recentNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDelete={deleteNotification}
          />
        ))}
      </div>
    </div>
  )
}

export default NotificationList
