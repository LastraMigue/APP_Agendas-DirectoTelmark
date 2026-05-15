import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock } from 'lucide-react'
import Button from '../Button'
import Input from '../Input'
import useAuth from '../../hooks/useAuth'
import './LoginForm.css'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
})

const LoginForm = () => {
  const [authError, setAuthError] = useState(null)
  const { signIn, loading } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const onSubmit = async (data) => {
    setAuthError(null)
    try {
      await signIn(data.email, data.password)
      navigate('/dashboard')
    } catch (error) {
      setAuthError(error.message)
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
      {authError && (
        <div className="login-form-error">
          {authError}
        </div>
      )}

      <Input
        label="Correo"
        type="email"
        placeholder="tu@email.com"
        icon={Mail}
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Contraseña"
        type="password"
        placeholder="Tu contraseña"
        icon={Lock}
        error={errors.password?.message}
        {...register('password')}
      />

      <Button 
        type="submit" 
        variant="primary" 
        size="large"
        loading={loading}
        className="login-form-submit"
      >
        Iniciar Sesión
      </Button>
    </form>
  )
}

export default LoginForm
