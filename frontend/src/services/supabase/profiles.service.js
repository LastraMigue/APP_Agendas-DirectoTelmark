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

  // OBTENER ADMINISTRADORES
  async getAdmins() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'admin')
    if (error) {
      console.error('Error al cargar administradores:', error.message)
      return []
    }
    return data || []
  },

  // BÚSQUEDAS POR ID / EMAIL
  async getById(id) {
    console.log('DEBUG: profilesService.getById empezando para ID:', id);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      
      if (error) {
        console.error('DEBUG: Error en getById:', error);
        throw error;
      }
      console.log('DEBUG: profilesService.getById terminado. Encontrado:', !!data);
      return data || null
    } catch (err) {
      console.error('DEBUG: Excepción en getById:', err);
      return null;
    }
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
    console.log('DEBUG: profilesService.create empezando', profile);
    const newProfile = {
      id: profile.id || crypto.randomUUID(), // Generar UUID si no existe
      ...profile
    }
    const { data, error } = await supabase
      .from('profiles')
      .insert([newProfile])
      .select()
      .single()
    if (error) {
      console.error('DEBUG: Error en create:', error);
      throw error
    }
    console.log('DEBUG: profilesService.create terminado');
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
    console.log('DEBUG: ensureProfileForUser empezando para:', authUser.email);
    try {
      const existing = await this.getById(authUser.id)
      if (existing) {
        console.log('DEBUG: Perfil existente por ID encontrado');
        return existing
      }

      // Si no existe por ID, buscamos por email (caso de cliente pre-registrado por un agente)
      console.log('DEBUG: Buscando perfil por email:', authUser.email);
      const existingByEmail = await this.getByEmail(authUser.email.toLowerCase())
      if (existingByEmail) {
        console.log('DEBUG: Perfil existente por email encontrado con ID:', existingByEmail.id, '. Actualizando ID a:', authUser.id);
        // Actualizamos el ID de la fila existente al ID real de Supabase Auth
        const updated = await this.update(existingByEmail.id, { id: authUser.id })
        return updated
      }

      console.log('DEBUG: Perfil no encontrado, creando...');
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

