import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, User, Phone } from 'lucide-react'
import Button from '../Button'
import Input from '../Input'
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

const ClientLoginForm = () => {
  const [authError, setAuthError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Registration info, 2: OTP
  const [email, setEmail] = useState('')
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    getValues,
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
        // Ahora que el email está verificado, guardamos los datos del perfil
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
            label="Nombre del Cliente"
            type="text"
            placeholder="Tu nombre completo"
            icon={User}
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="Email del Cliente"
            type="email"
            placeholder="tu@email.com"
            icon={Mail}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Número de Teléfono"
            type="tel"
            placeholder="600 000 000"
            icon={Phone}
            error={errors.phone?.message}
            {...register('phone')}
          />
        </>
      ) : (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Hemos enviado un código de 8 dígitos a <strong>{email}</strong>
          </p>
          <Input
            label="Código de Verificación"
            type="text"
            placeholder="00000000"
            maxLength={8}
            icon={User}
            error={errors.otp?.message}
            {...register('otp')}
          />
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
        <button 
          type="button" 
          className="resend-button"
          onClick={() => setStep(1)}
          style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', marginTop: '10px', fontSize: '14px', width: '100%' }}
        >
          Corregir datos o volver a intentar
        </button>
      )}
    </form>
  )
}

export default ClientLoginForm
