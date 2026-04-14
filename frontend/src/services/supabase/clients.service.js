import { supabase } from './client'

export const clientsService = {
  async getAll() {
    const { data, error } = await supabase.from('clients').select('*')
    if (error) throw error
    return data
  },

  async getById(id) {
    const { data, error } = await supabase.from('clients').select('*').eq('id', id).single()
    if (error) throw error
    return data
  },

  async create(client) {
    const { data, error } = await supabase.from('clients').insert(client).select().single()
    if (error) throw error
    return data
  },

  async update(id, client) {
    const { data, error } = await supabase.from('clients').update(client).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) throw error
  }
}
