import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, User, Phone } from 'lucide-react'
import Button from '../../common/Button'
import Input from '../../common/Input'
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
    .min(3, 'El nombre debe tener al menos 3 caracteres')
})

const ClientLoginForm = () => {
  const [authError, setAuthError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(clientLoginSchema),
    defaultValues: {
      email: '',
      phone: '',
      name: ''
    }
  })

  const onSubmit = async (data) => {
    setAuthError(null)
    setLoading(true)
    try {
      // TODO: Implement client authentication logic
      console.log('Cliente login:', data)
      // For now, just simulate success or navigation
      navigate('/dashboard')
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
      {authError && (
        <div className="login-form-error">
          {authError}
        </div>
      )}
      {/* El orden de los campos ha sido actualizado: Nombre, Email, Teléfono */}

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

      <Button 
        type="submit" 
        variant="primary" 
        size="large"
        loading={loading}
        className="login-form-submit"
      >
        Enviar Datos Cliente
      </Button>
    </form>
  )
}

export default ClientLoginForm
