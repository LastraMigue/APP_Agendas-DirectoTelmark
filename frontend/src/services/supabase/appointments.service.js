import { supabase } from './client'

export const appointmentsService = {
  async getAll() {
    const { data, error } = await supabase.from('appointments').select('*')
    if (error) throw error
    return data
  },

  async getById(id) {
    const { data, error } = await supabase.from('appointments').select('*').eq('id', id).single()
    if (error) throw error
    return data
  },

  async create(appointment) {
    const { data, error } = await supabase.from('appointments').insert(appointment).select().single()
    if (error) throw error
    return data
  },

  async update(id, appointment) {
    const { data, error } = await supabase.from('appointments').update(appointment).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('appointments').delete().eq('id', id)
    if (error) throw error
  }
}
