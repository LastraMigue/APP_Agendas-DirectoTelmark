import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import ClientLoginForm from '../../components/Clientloginform'
import useAuth from '../../hooks/useAuth'

const ClientLoginPage = () => {
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
    <div className="login-page">
      <div className="login-container">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div className="login-header">
          <img 
            src="https://directotelmark.es/wp-content/uploads/2025/02/directotelmarksinfondo.png" 
            alt="Directo Telmark" 
            className="login-logo"
          />
          <h1 className="login-title">Acceso Clientes</h1>
          <p className="login-subtitle">Inicia sesión para gestionar tus citas corporativas</p>
        </div>

        <ClientLoginForm />
        
        <div className="login-footer">
          <p className="test-credentials">
            ¿Ya tienes cuenta? <Link to="/iniciar-sesion" className="login-link">Inicia sesión aquí</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ClientLoginPage
