import { useState, useEffect, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../../../context/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, User, ArrowLeft } from 'lucide-react'
import Button from '../../common/Button'
import Input from '../../common/Input'
import { authService } from '../../../services/supabase/auth.service'
import useAuth from '../../../hooks/useAuth'
import './ClientSignInPage.css'

const clientSignInSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido'),
  otp: z.string().optional()
})

const ClientSignInPage = () => {
  const { isAuthenticated, signOut, loading: authLoading, signInClient } = useAuth()
  const [isFirstCheck, setIsFirstCheck] = useState(true)
  const [authError, setAuthError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Email, 2: OTP
  const [email, setEmail] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && isAuthenticated && isFirstCheck) {
      signOut()
    }
    if (!authLoading) {
      setIsFirstCheck(false)
    }
  }, [authLoading, isAuthenticated, isFirstCheck, signOut])

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(clientSignInSchema),
    defaultValues: {
      email: '',
      otp: ''
    }
  })

  const onSendOTP = async (data) => {
    setAuthError(null)
    setLoading(true)
    try {
      await authService.sendOTP(data.email, 'login')
      setEmail(data.email)
      setStep(2)
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const onVerifyOTP = async (data) => {
    setAuthError(null)
    setLoading(true)
    try {
      const result = await authService.verifyOTP(email, data.otp)
      if (result.success) {
        navigate('/dashboard')
      }
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="signin-page">
      <div className="signin-container">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div className="signin-header">
          <img
            src="https://directotelmark.es/wp-content/uploads/2025/02/directotelmarksinfondo.png"
            alt="Directo Telmark"
            className="signin-logo"
          />
          <h1 className="signin-title">Acceso Clientes</h1>
          <p className="signin-subtitle">
            {step === 1
              ? 'Ingresa tu email para recibir un código de acceso'
              : `Ingresa el código de 8 dígitos enviado a ${email}`}
          </p>
        </div>

        <form className="signin-form" onSubmit={handleSubmit(step === 1 ? onSendOTP : onVerifyOTP)}>
          {authError && (
            <div className="signin-form-error">
              {authError}
            </div>
          )}

          {step === 1 ? (
            <Input
              label="Email del Cliente"
              type="email"
              placeholder="tu@email.com"
              icon={Mail}
              error={errors.email?.message}
              {...register('email')}
            />
          ) : (
            <Input
              label="Código de Verificación"
              type="text"
              placeholder="00000000"
              maxLength={8}
              icon={User}
              error={errors.otp?.message}
              {...register('otp')}
            />
          )}

          <Button
            type="submit"
            variant="primary"
            size="large"
            loading={loading}
            className="signin-form-submit"
          >
            {step === 1 ? 'Enviar Código' : 'Verificar e Ingresar'}
          </Button>

          {step === 2 && (
            <button
              type="button"
              className="resend-button"
              onClick={() => setStep(1)}
              style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', marginTop: '10px', fontSize: '14px' }}
            >
              Cambiar email o volver a intentar
            </button>
          )}
        </form>

        <div className="signin-footer">
          <p className="signin-footer-text">
            ¿No tienes cuenta? <Link to="/registrarse" className="signin-link">Regístrate aquí</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ClientSignInPage
