import { supabase } from './client'

export const authService = {
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  async sendOTP(email) {
    // 1. Validar que el usuario existe y es CLIENTE antes de enviar nada
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (profileError) throw new Error('Error al verificar el perfil.')
    
    if (!profile) {
      throw new Error('El correo no está registrado como cliente. Por favor, contacta con un agente.')
    }

    if (profile.role !== 'client') {
      throw new Error('Este acceso es exclusivo para clientes.')
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
  },

  async verifyOTP(email, token) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'magiclink'
    })
    if (error) throw error
    return { success: true, data }
  }
}
