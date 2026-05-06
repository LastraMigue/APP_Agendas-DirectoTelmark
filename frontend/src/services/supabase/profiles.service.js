import { supabase } from './client'

export const profilesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true })
    if (error) throw error
    return data
  },

  async getByRole(role) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', role)
      .order('full_name', { ascending: true })
    if (error) throw error
    return data
  },

  async getAgents() {
    return this.getByRole('agent')
  },

  async getClients() {
    return this.getByRole('client')
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async getByEmail(email) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle()
    if (error) throw error
    return data
  },

  async create(profile) {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, profile) {
    const { data, error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async upsertClient(clientData) {
    // Buscar si ya existe un cliente con ese email
    const existing = await this.getByEmail(clientData.email)
    
    if (existing) {
      return this.update(existing.id, { ...clientData, role: 'client' })
    }
    
    return this.create({ ...clientData, role: 'client' })
  }
}
