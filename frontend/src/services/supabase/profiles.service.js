import { supabase } from './client'

export const profilesService = {
  // OBTENER AGENTES
  async getAgents() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, role, full_name, email')
      .in('role', ['agent', 'admin'])
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
      id: profile.id || crypto.randomUUID(), // Generar UUID si no existe
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

  async ensureProfileForUser(authUser) {
    if (!authUser) return null
    try {
      const existing = await this.getById(authUser.id)
      if (existing) return existing

      // Si no existe, creamos el perfil inicial
      return await this.create({
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.email,
        role: authUser.user_metadata?.role || 'client'
      })
    } catch (err) {
      console.error('Error en ensureProfileForUser:', err)
      return null
    }
  },

  async upsertClient(clientData) {
    // Buscar si ya existe un cliente con ese email
    const existing = await this.getByEmail(clientData.email)

    if (existing) {
      return this.update(existing.id, { ...clientData, role: 'client' })
    }

    return this.create({ ...clientData, role: 'client' })
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

