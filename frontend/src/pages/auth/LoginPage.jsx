import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import LoginForm from '../../components/auth/LoginForm'
import useAuth from '../../hooks/useAuth'

const LoginPage = () => {
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
          <h1 className="login-title">Agenda de Citas</h1>
          <p className="login-subtitle">Accede a tu cuenta para gestionar tus citas</p>
        </div>

        <LoginForm />

        <div className="login-footer">
          <div className="test-credentials-container">
            <p className="test-credentials-title"><strong>Acceso de Prueba:</strong></p>
            <div className="test-credentials-grid">
              <div className="test-credential-item">
                <span className="label">Admin:</span>
                <code>admin@test.com / password123</code>
              </div>
              <div className="test-credential-item">
                <span className="label">Agente:</span>
                <code>agente007@test.com / 007</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage


