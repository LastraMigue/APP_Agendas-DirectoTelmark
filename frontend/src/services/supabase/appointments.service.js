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

  // Elimina la cita antigua y crea una nueva (evita duplicados en BD)
  async reschedule(oldId, newAppointmentData) {
    // 1. Obtenemos los datos completos de la cita original
    const { data: oldApp, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', oldId)
      .single()
    if (fetchError) throw fetchError

    // 2. Creamos el nuevo registro fusionando los datos originales con los nuevos
    const { id: _removed, created_at: _ca, ...baseData } = oldApp
    const newData = { ...baseData, ...newAppointmentData }

    const { data: created, error: createError } = await supabase
      .from('appointments')
      .insert(newData)
      .select()
      .single()
    if (createError) throw createError

    // 3. Eliminamos la cita antigua solo si la nueva se creó correctamente
    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .eq('id', oldId)
    if (deleteError) throw deleteError

    return created
  },

  async delete(id) {
    const { error } = await supabase.from('appointments').delete().eq('id', id)
    if (error) throw error
  }
}
