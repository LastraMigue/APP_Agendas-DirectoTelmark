import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import ClientLoginForm from '../../components/Clientloginform'
import useAuth from '../../hooks/useAuth'

import logo from '../../assets/logo.jpg'

const ClientLoginPage = () => {
  const { isAuthenticated, signOut, loading } = useAuth()
  const [isFirstCheck, setIsFirstCheck] = useState(true)
  const [step, setStep] = useState(1)
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
          <h1 className="login-title">Registro de Clientes</h1>
          <p className="login-subtitle">Regístrate para gestionar tus citas corporativas</p>
        </div>

        <ClientLoginForm onStepChange={setStep} />
        
        <div className="login-footer">
          {step === 1 && (
            <p className="test-credentials">
              ¿Ya tienes cuenta? <Link to="/iniciar-sesion" className="login-link">Inicia sesión aquí</Link>
            </p>
          )}
          <p className="copyright">© 2026 Directo Telmark. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  )
}

export default ClientLoginPage
