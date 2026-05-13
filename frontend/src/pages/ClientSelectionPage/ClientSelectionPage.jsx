import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, LogIn, ArrowLeft } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import './ClientSelectionPage.css'

const ClientSelectionPage = () => {
  const { isAuthenticated, signOut, loading } = useAuth()
  const [isFirstCheck, setIsFirstCheck] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && isAuthenticated && isFirstCheck) {
      signOut()
    }
    if (!loading) {
      setIsFirstCheck(false)
    }
  }, [loading, isAuthenticated, isFirstCheck, signOut])

  return (
    <div className="selection-page">
      <div className="selection-container">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div className="selection-header">
          <img 
            src="https://directotelmark.es/wp-content/uploads/2025/02/directotelmarksinfondo.png" 
            alt="Directo Telmark" 
            className="selection-logo"
          />
          <h1 className="selection-title">Acceso Clientes</h1>
          <p className="selection-subtitle">Selecciona una opción para continuar</p>
        </div>

        <div className="selection-buttons">
          <button 
            className="selection-button register-button"
            onClick={() => navigate('/registrarse')}
          >
            <UserPlus size={32} />
            <span className="button-text">Registrarse</span>
            <span className="button-description">Crear una cuenta nueva</span>
          </button>

          <button 
            className="selection-button login-button"
            onClick={() => navigate('/iniciar-sesion')}
          >
            <LogIn size={32} />
            <span className="button-text">Iniciar Sesión</span>
            <span className="button-description">Acceder a tu cuenta</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ClientSelectionPage
