import { Trash2, Check, Calendar, UserPlus, UserMinus, AlertCircle } from 'lucide-react'
import './NotificationItem.css'

const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'appointment':
      case 'appointment_reminder':
        return <Calendar className="notification-icon appointment" size={18} />
      case 'client_created':
      case 'agent_created':
        return <UserPlus className="notification-icon created" size={18} />
      case 'client_deleted':
      case 'agent_deleted':
        return <UserMinus className="notification-icon deleted" size={18} />
      default:
        return <AlertCircle className="notification-icon default" size={18} />
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    })
  }

  return (
    <div className={`notification-item ${notification.read ? 'read' : 'unread'}`}>
      <div className="notification-content-wrapper">
        {getIcon(notification.type)}
        <div className="notification-text">
          <p className="notification-title">{notification.title}</p>
          <p className="notification-message">{notification.message}</p>
          <span className="notification-time">{formatDate(notification.created_at)}</span>
        </div>
      </div>
      <div className="notification-actions">
        {!notification.read && (
          <button 
            onClick={() => onMarkAsRead(notification.id)} 
            className="action-btn mark-read"
            title="Marcar como leída"
          >
            <Check size={14} />
          </button>
        )}
        <button 
          onClick={() => onDelete(notification.id)} 
          className="action-btn delete"
          title="Eliminar"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

export default NotificationItem
