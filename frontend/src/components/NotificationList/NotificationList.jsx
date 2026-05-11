import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { NotificationContext } from '../../context/NotificationContext'
import NotificationItem from '../NotificationItem/NotificationItem'
import { BellOff } from 'lucide-react'
import './NotificationList.css'

const NotificationList = () => {
  const { notifications, markAsRead, deleteNotification, clearAll, loading } = useContext(NotificationContext)
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="notification-list-container">
        <div className="notifications-loading">Cargando notificaciones...</div>
      </div>
    )
  }

  if (notifications.length === 0) {
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
        <span>Notificaciones</span>
        <button onClick={clearAll} className="clear-all-btn">Limpiar todo</button>
      </div>
      <div className="notification-items-wrapper">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
          />
        ))}
      </div>
      <div className="notification-list-footer">
        <button onClick={() => navigate('/notifications')}>Ver todas las notificaciones</button>
      </div>
    </div>
  )
}

export default NotificationList
