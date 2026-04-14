import { supabase } from './client'

export const agentsService = {
  async getAll() {
    const { data, error } = await supabase.from('agents').select('*')
    if (error) throw error
    return data
  },

  async getById(id) {
    const { data, error } = await supabase.from('agents').select('*').eq('id', id).single()
    if (error) throw error
    return data
  },

  async create(agent) {
    const { data, error } = await supabase.from('agents').insert(agent).select().single()
    if (error) throw error
    return data
  },

  async update(id, agent) {
    const { data, error } = await supabase.from('agents').update(agent).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('agents').delete().eq('id', id)
    if (error) throw error
  }
}
