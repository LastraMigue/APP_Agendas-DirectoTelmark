import { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../../../context/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, User, ArrowLeft } from 'lucide-react'
import Button from '../../common/Button'
import Input from '../../common/Input'
import './ClientSignInPage.css'

const clientSignInSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido'),
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
})

const ClientSignInPage = () => {
  const [authError, setAuthError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { signInClient } = useContext(AuthContext)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(clientSignInSchema),
    defaultValues: {
      email: '',
      name: ''
    }
  })

  const onSubmit = async (data) => {
    setAuthError(null)
    setLoading(true)
    try {
      await signInClient(data.email, data.name)
      navigate('/dashboard')
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
          <h1 className="signin-title">Iniciar Sesión</h1>
          <p className="signin-subtitle">Ingresa tu email y nombre para acceder</p>
        </div>

        <form className="signin-form" onSubmit={handleSubmit(onSubmit)}>
          {authError && (
            <div className="signin-form-error">
              {authError}
            </div>
          )}

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

          <Button 
            type="submit" 
            variant="primary" 
            size="large"
            loading={loading}
            className="signin-form-submit"
          >
            Iniciar Sesión
          </Button>
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
