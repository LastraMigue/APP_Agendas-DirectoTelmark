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

  async sendOTP(email, type) {
    // Si es registro, verificamos que el cliente NO exista
    if (type === 'registration') {
      const { data: exists, error: rpcError } = await supabase
        .rpc('check_client_email_exists', { search_email: email })
      
      if (rpcError) {
        throw new Error('Error al verificar el correo. Intenta de nuevo.')
      }

      if (exists) {
        throw new Error('Ya tienes una cuenta con este correo. Por favor, inicia sesión.')
      }
    }

    // Si es login, verificamos primero que el cliente existe
    if (type === 'login') {
      const { data: exists, error: rpcError } = await supabase
        .rpc('check_client_email_exists', { search_email: email })
      
      if (rpcError || !exists) {
        throw new Error('El correo no está registrado como cliente.')
      }
    }

    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: type === 'registration', // Solo crea usuario en auth.users si es registro
      }
    })
    if (error) throw error
    return data
  },

  async verifyOTP(email, token) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    })
    if (error) throw error
    return { success: true, data }
  },

  async createClient(clientData) {
    const { data, error } = await supabase
      .from('clients')
      .insert([clientData])
      .select()
    if (error) throw error
    
    // Actualizamos el nombre en los metadatos de autenticación para que aparezca en el dashboard
    try {
      await supabase.auth.updateUser({
        data: { 
          full_name: clientData.full_name,
          role: 'cliente'
        }
      })
    } catch (updateError) {
      console.warn('No se pudieron actualizar los metadatos del usuario:', updateError)
    }

    return data
  }
}
