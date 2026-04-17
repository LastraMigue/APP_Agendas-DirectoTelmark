import { Navigate } from 'react-router-dom'
import ClientLoginForm from '../../components/auth/Clientloginform'
import useAuth from '../../hooks/useAuth'

const ClientLoginPage = () => {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="login-page">
      <div className="login-container">
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
            <strong>¿Eres nuevo cliente?</strong><br />
            Contacta con tu asesor de Directo Telmark para obtener acceso.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ClientLoginPage
