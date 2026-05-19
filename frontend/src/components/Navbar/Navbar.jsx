import { useContext, useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { User, LogOut, Settings, ChevronDown, Clock } from 'lucide-react'
import logoImg from '../../assets/logo.jpg'
import './Navbar.css'

const Navbar = () => {
  const { user, signOut } = useContext(AuthContext)
  const [showDropdown, setShowDropdown] = useState(false)
  const navigate = useNavigate()
  const userDropdownRef = useRef(null)
  const [time, setTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const options = {
        timeZone: 'Europe/Madrid',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      const formatter = new Intl.DateTimeFormat('es-ES', options);
      setTime(formatter.format(new Date()));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
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
      <div className="navbar-left" style={{ display: 'flex', alignItems: 'center' }}>
        <div className="navbar-logo" onClick={() => navigate('/dashboard')}>
          <img
            src={logoImg}
            alt="Directo Telmark"
            className="logo-img"
          />
        </div>
        <div className="navbar-clock">
          <Clock size={16} className="clock-icon" />
          <span>{time}</span>
        </div>
      </div>

      <div className="navbar-actions">
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
