import { supabase } from './client'

export const usersService = {
  async getAll() {
    const { data, error } = await supabase.from('users').select('*')
    if (error) throw error
    return data
  },

  async getById(id) {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single()
    if (error) throw error
    return data
  },

  async create(user) {
    const { data, error } = await supabase.from('users').insert(user).select().single()
    if (error) throw error
    return data
  },

  async update(id, user) {
    const { data, error } = await supabase.from('users').update(user).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('users').delete().eq('id', id)
    if (error) throw error
  }
}
