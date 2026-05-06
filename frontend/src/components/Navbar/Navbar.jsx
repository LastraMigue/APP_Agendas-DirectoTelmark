import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { User, LogOut, Settings, Bell, ChevronDown } from 'lucide-react'
import './Navbar.css'

const Navbar = () => {
  const { user, signOut } = useContext(AuthContext)
  const [showDropdown, setShowDropdown] = useState(false)
  const navigate = useNavigate()

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
        <button className="icon-button">
          <Bell size={20} />
          <span className="badge"></span>
        </button>

        <div className="user-profile">
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
              <button onClick={() => navigate('/profile')}>
                <User size={16} /> Mi Perfil
              </button>
              <button onClick={() => navigate('/settings')}>
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
