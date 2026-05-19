import { supabase } from './client'

const translateError = (error) => {
  if (!error) return null
  const message = error.message || error
  
  if (message.includes('Invalid login credentials')) return 'Credenciales de acceso incorrectas.'
  if (message.includes('Email not confirmed')) return 'El correo electrónico no ha sido verificado.'
  if (message.includes('User not found')) return 'Usuario no encontrado.'
  if (message.includes('User already registered')) return 'Este correo electrónico ya está registrado.'
  if (message.includes('Invalid OTP') || message.includes('otp_expired')) return 'El código es inválido o ha caducado.'
  if (message.includes('Too many requests')) return 'Demasiados intentos. Por favor, inténtalo más tarde.'
  if (message.includes('Database error')) return 'Error de conexión con la base de datos.'
  
  // Si el mensaje ya contiene palabras clave en español de nuestras validaciones manuales, lo devolvemos tal cual
  if (message.includes('registrado') || message.includes('cliente') || message.includes('agente') || message.includes('exclusivo')) {
    return message
  }
  
  return 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.'
}

export const authService = {
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(translateError(error))
      return data
    } catch (error) {
      throw new Error(translateError(error))
    }
  },

  async signUp(email, password) {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw new Error(translateError(error))
      return data
    } catch (error) {
      throw new Error(translateError(error))
    }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(translateError(error))
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  async createProfile(profileData) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      throw new Error(translateError(error))
    }
  },

  async sendOTP(email, type = 'login') {
    try {
      // 1. Validar existencia del usuario según el tipo
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('email', email.toLowerCase())
        .maybeSingle()

      if (profileError) throw new Error('Error al verificar el perfil.')

      if (type === 'registration') {
        if (profile) {
          throw new Error('Este correo ya está registrado. Por favor, inicia sesión.')
        }
      } else if (type === 'login') {
        if (!profile) {
          throw new Error('El correo no está registrado como cliente. Por favor, contacta con un agente.')
        }
        if (profile.role !== 'client') {
          throw new Error('Este acceso es exclusivo para clientes.')
        }
      }

      // 2. Enviar OTP
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: window.location.origin,
        },
      })
      
      if (error) throw error
      return true
    } catch (error) {
      throw new Error(translateError(error))
    }
  },

  async verifyOTP(email, token) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      })
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      throw new Error(translateError(error))
    }
  }
}
