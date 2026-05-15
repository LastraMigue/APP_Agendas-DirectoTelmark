import { useState, useEffect, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, User, ArrowLeft } from 'lucide-react'
import Button from '../../components/Button'
import Input from '../../components/Input'
import OTPInput from '../../components/OTPInput'
import { authService } from '../../services/supabase/auth.service'
import useAuth from '../../hooks/useAuth'
import logo from '../../assets/logo.jpg'
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
  const [countdown, setCountdown] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && isAuthenticated && isFirstCheck) {
      signOut()
    }
    if (!authLoading) {
      setIsFirstCheck(false)
    }
  }, [authLoading, isAuthenticated, isFirstCheck, signOut])

  useEffect(() => {
    let timer
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [countdown])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    getValues
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
      setCountdown(60) // 60 seconds countdown
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const onResendOTP = async () => {
    if (countdown > 0) return
    setAuthError(null)
    setLoading(true)
    try {
      await authService.sendOTP(email, 'login')
      setCountdown(60)
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
            src={logo}
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
              label="Correo"
              type="email"
              placeholder="tu@email.com"
              icon={Mail}
              error={errors.email?.message}
              {...register('email')}
            />
          ) : (
            <div className="otp-section" style={{ marginBottom: '20px' }}>
              <p className="input-label" style={{ marginBottom: '12px', textAlign: 'center' }}>Código de Verificación</p>
              <Controller
                name="otp"
                control={control}
                render={({ field }) => (
                  <OTPInput
                    length={8}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.otp?.message}
                  />
                )}
              />
            </div>
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
            <div className="resend-container">
              <button
                type="button"
                className="resend-button"
                disabled={countdown > 0}
                onClick={onResendOTP}
              >
                {countdown > 0 ? `Reenviar código en ${countdown}s` : 'Reenviar código'}
              </button>
            </div>
          )}
        </form>

        <div className="signin-footer">
          {step === 1 && (
            <p className="signin-footer-text">
              ¿No tienes cuenta? <Link to="/registrarse" className="signin-link">Regístrate aquí</Link>
            </p>
          )}
          <p className="copyright">© 2026 Directo Telmark. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  )
}

export default ClientSignInPage
