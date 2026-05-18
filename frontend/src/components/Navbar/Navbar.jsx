import { useContext, useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { NotificationContext } from '../../context/NotificationContext'
import { User, LogOut, Settings, Bell, ChevronDown } from 'lucide-react'
import NotificationList from '../NotificationList/NotificationList'
import './Navbar.css'

const Navbar = () => {
  const { user, signOut } = useContext(AuthContext)
  const { unreadCount } = useContext(NotificationContext)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const navigate = useNavigate()
  const notificationRef = useRef(null)
  const userDropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario'
  const userInitial = displayName.charAt(0).toUpperCase()

  return (
    <nav className="navbar">
      <div className="navbar-logo" onClick={() => navigate('/dashboard')}>
        <img
          src="https://directotelmark.es/wp-content/uploads/2025/02/directotelmarksinfondo.png"
          alt="Directo Telmark"
          className="logo-img"
        />
      </div>

      <div className="navbar-actions">
        <div className="notification-wrapper" ref={notificationRef}>
          <button
            className={`icon-button ${showNotifications ? 'active' : ''}`}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className="notifications-dropdown">
              <NotificationList />
            </div>
          )}
        </div>

        <div className="user-profile" ref={userDropdownRef}>
          <div
            className="user-info"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="avatar">{userInitial}</div>
            <span className="user-name">{displayName}</span>
            <ChevronDown size={16} className={showDropdown ? 'rotate' : ''} />
          </div>

          {showDropdown && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <strong>{displayName}</strong>
                <span>{user?.email}</span>
              </div>
              <div className="divider"></div>

              <button onClick={() => { navigate('/dashboard/settings'); setShowDropdown(false) }}>
                <Settings size={16} /> Configuración
              </button>
              <div className="divider"></div>
              <button onClick={handleSignOut} className="logout-button">
                <LogOut size={16} /> Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
