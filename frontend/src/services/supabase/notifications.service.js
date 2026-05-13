import { supabase } from './client'

export const notificationsService = {
  async getAll() {
    const { data, error } = await supabase.from('notifications').select('*')
    if (error) throw error
    return data
  },

  async getByUserId(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async create(notification) {
    const { data, error } = await supabase.from('notifications').insert(notification).select().single()
    if (error) throw error
    return data
  },

  async markAsRead(id) {
    const { data, error } = await supabase.from('notifications').update({ read: true }).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('notifications').delete().eq('id', id)
    if (error) throw error
  }
}
