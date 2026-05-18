import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import LoginForm from '../../components/LoginForm'
import useAuth from '../../hooks/useAuth'
import './LoginPage.css'

import logo from '../../assets/logo.jpg'

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
            src={logo}
            alt="Directo Telmark"
            className="login-logo"
          />
          <h1 className="login-title">Agenda de Citas</h1>
          <p className="login-subtitle">Accede a tu cuenta para gestionar tus citas</p>
        </div>

        <LoginForm />

        <div className="login-footer">
          <p className="copyright">© 2026 Directo Telmark. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage


