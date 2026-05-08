import { supabase } from './client'

export const profilesService = {
  // OBTENER AGENTES
  async getAgents() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'agent')
      .order('full_name', { ascending: true })
    if (error) {
      console.error('Error al cargar agentes:', error.message)
      return []
    }
    return data || []
  },

  // OBTENER CLIENTES
  async getClients() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'client')
      .order('full_name', { ascending: true })
    if (error) {
      console.error('Error al cargar clientes:', error.message)
      return []
    }
    return data || []
  },

  // BÚSQUEDAS POR ID / EMAIL
  async getById(id) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    return data || null
  },

  async getByEmail(email) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle()
    return data || null
  },

  // CREAR PERFIL
  async create(profile) {
    const newProfile = {
      id: profile.id || crypto.randomUUID(),
      ...profile
    }
    const { data, error } = await supabase
      .from('profiles')
      .insert([newProfile])
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ACTUALIZAR PERFIL
  async update(id, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error, count } = await supabase
      .from('profiles')
      .delete({ count: 'exact' })
      .eq('id', id)

    if (error) throw error
    return count
  }
}
