import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, User, Phone } from 'lucide-react'
import Button from '../Button'
import Input from '../Input'
import OTPInput from '../OTPInput'
import { authService } from '../../services/supabase/auth.service'
import './Clientloginform.css'

const clientLoginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido'),
  phone: z
    .string()
    .min(1, 'El número de teléfono es requerido')
    .min(9, 'El número de teléfono debe tener al menos 9 caracteres'),
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres'),
  otp: z.string().optional()
})

const ClientLoginForm = ({ onStepChange }) => {
  const [authError, setAuthError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Registration info, 2: OTP
  const [email, setEmail] = useState('')
  const [countdown, setCountdown] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (onStepChange) onStepChange(step)
  }, [step, onStepChange])

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
    getValues,
    control,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(clientLoginSchema),
    defaultValues: {
      email: '',
      phone: '',
      name: '',
      otp: ''
    }
  })

  const onSendOTP = async (data) => {
    setAuthError(null)
    setLoading(true)
    try {
      await authService.sendOTP(data.email, 'registration')
      setEmail(data.email)
      setStep(2)
      setCountdown(60)
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
      await authService.sendOTP(email, 'registration')
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
        const formData = getValues()
        await authService.createProfile({
          full_name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: 'client'
        })
        navigate('/dashboard')
      }
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit(step === 1 ? onSendOTP : onVerifyOTP)}>
      {authError && (
        <div className="login-form-error">
          {authError}
        </div>
      )}

      {step === 1 ? (
        <>
          <Input
            label="Nombre"
            type="text"
            placeholder="Tu nombre completo"
            icon={User}
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="Correo"
            type="email"
            placeholder="tu@email.com"
            icon={Mail}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Número"
            type="tel"
            placeholder="600 000 000"
            icon={Phone}
            error={errors.phone?.message}
            {...register('phone')}
          />
        </>
      ) : (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
            Hemos enviado un código de 8 dígitos a <strong>{email}</strong>
          </p>
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
        </div>
      )}

      <Button 
        type="submit" 
        variant="primary" 
        size="large"
        loading={loading}
        className="login-form-submit"
      >
        {step === 1 ? 'Registrarme' : 'Verificar y Completar'}
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
  )
}

export default ClientLoginForm
