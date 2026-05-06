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
    // Verificamos si el perfil existe en la tabla profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('email', email.toLowerCase())
      .maybeSingle()
    
    if (profileError) throw new Error('Error al verificar el usuario.')

    // Si es registro, verificamos que NO exista
    if (type === 'registration' && profile) {
      throw new Error('Ya tienes una cuenta con este correo. Por favor, inicia sesión.')
    }

    // Si es login, verificamos que exista y que sea cliente
    if (type === 'login') {
      if (!profile) {
        throw new Error('El correo no está registrado.')
      }
      if (profile.role !== 'client') {
        throw new Error('Esta entrada es solo para clientes.')
      }
    }

    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: type === 'registration', 
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

  async createProfile(profileData) {
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id

    // Buscamos si ya existe el perfil por email
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', profileData.email.toLowerCase())
      .maybeSingle()

    let result
    if (existingProfile) {
      // Actualizamos
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          id: userId || existingProfile.id, 
          email: profileData.email.toLowerCase(),
          role: profileData.role || 'client'
        })
        .eq('id', existingProfile.id)
        .select()
        .single()
      if (error) throw error
      result = data
    } else {
      // Creamos
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          ...profileData,
          id: userId,
          email: profileData.email.toLowerCase(),
          role: profileData.role || 'client'
        }])
        .select()
        .single()
      if (error) throw error
      result = data
    }
    
    // Actualizamos metadatos de Supabase Auth
    try {
      await supabase.auth.updateUser({
        data: { 
          full_name: profileData.full_name,
          role: profileData.role || 'client'
        }
      })
    } catch (updateError) {
      console.warn('No se pudieron actualizar los metadatos:', updateError)
    }

    return result
  }
}
