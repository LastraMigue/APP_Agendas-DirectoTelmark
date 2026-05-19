import { useState, useEffect, useCallback, useContext } from 'react'
import { MainLayout } from '../../layouts/MainLayout'
import { profilesService } from '../../services/supabase/profiles.service'
import { NotificationContext } from '../../context/NotificationContext'
import { Contact, AlertTriangle } from 'lucide-react'
import Loader from '../../components/Loader/Loader'
import './ManageClientsPage.css'

const ManageClientsPage = () => {
  const { addNotification } = useContext(NotificationContext)
  const [clients, setClients] = useState([])
  const [filteredClients, setFilteredClients] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newClient, setNewClient] = useState({ full_name: '', email: '', phone: '' })
  const [clientToDelete, setClientToDelete] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true)
      const data = await profilesService.getClients()
      setClients(data || [])
      setFilteredClients(data || [])
    } catch (err) {
      setError('Error al cargar clientes: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredClients(clients)
      return
    }
    const term = searchTerm.toLowerCase()
    const filtered = clients.filter(client => 
      (client.full_name && client.full_name.toLowerCase().includes(term)) ||
      (client.email && client.email.toLowerCase().includes(term)) ||
      (client.phone && client.phone.includes(term))
    )
    setFilteredClients(filtered)
  }, [searchTerm, clients])

  const handleDeleteClick = (id, name) => {
    setClientToDelete({ id, name })
  }

  const confirmDelete = async () => {
    if (!clientToDelete) return
    const { id, name } = clientToDelete
    setClientToDelete(null)
    
    setError('')
    setSuccess('')

    try {
      console.log('Intentando eliminar cliente ID:', id)
      const count = await profilesService.delete(id)

      if (count === 0) {
        setError('No se pudo eliminar el cliente. Es posible que no tengas permisos (RLS) o que el cliente ya no exista.')
      } else {
        setSuccess('Cliente eliminado correctamente')
        
        // Notify Admins
        try {
          const admins = await profilesService.getAdmins();
          for (const admin of admins) {
            await addNotification({
              user_id: admin.id,
              title: 'Cliente eliminado',
              message: `Se ha eliminado al cliente: ${name}`,
              type: 'client_deleted'
            })
          }
        } catch (adminErr) {
          console.error('Error notifying admins of deletion:', adminErr);
          // Fallback to notify current user at least
          addNotification({
            title: 'Cliente eliminado',
            message: `Se ha eliminado al cliente: ${name}`,
            type: 'client_deleted'
          })
        }
        
        fetchClients()
      }
    } catch (err) {
      console.error('Error al eliminar:', err)
      if (err.code === '23503') {
        setError('No se puede eliminar el cliente porque tiene citas o registros asociados. Elimina primero sus citas.')
      } else {
        setError('Error al eliminar: ' + (err.message || 'Error desconocido'))
      }
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!newClient.full_name || !newClient.email) {
      setError('Nombre y email son obligatorios')
      return
    }

    try {
      const createdClient = await profilesService.create({ ...newClient, role: 'client' })
      setSuccess('Cliente creado correctamente')
      
      // Notify Admins
      try {
        const admins = await profilesService.getAdmins();
        for (const admin of admins) {
          await addNotification({
            user_id: admin.id,
            title: 'Nuevo cliente',
            message: `Se ha creado el cliente: ${newClient.full_name}`,
            type: 'client_created'
          })
        }
      } catch (adminErr) {
        console.error('Error notifying admins of creation:', adminErr);
        // Fallback to notify current user
        addNotification({
          title: 'Nuevo cliente',
          message: `Se ha creado el cliente: ${newClient.full_name}`,
          type: 'client_created'
        })
      }

      setNewClient({ full_name: '', email: '', phone: '' })
      setShowCreateModal(false)
      fetchClients()
    } catch (err) {
      setError('Error al crear cliente: ' + err.message)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
          <Loader text="Cargando clientes..." />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="manage-clients-container">
        <header className="manage-clients-header">
          <h2><Contact size={28} className="header-icon" /> Gestión de Clientes</h2>
          <p>Administra los clientes registrados en el sistema</p>
        </header>

        <div className="manage-clients-card">
          <div className="card-header">
            <h3>Listado de Clientes</h3>
            <button className="btn-create" onClick={() => setShowCreateModal(true)}>
              + Nuevo Cliente
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="search-bar">
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="clients-table">
            <div className="table-header">
              <div className="col-name">Nombre</div>
              <div className="col-email">Email</div>
              <div className="col-phone">Teléfono</div>
              <div className="col-actions">Acciones</div>
            </div>
            {filteredClients.length === 0 ? (
              <div className="no-results">No se encontraron clientes</div>
            ) : (
              filteredClients.map(client => (
                <div key={client.id} className="table-row">
                  <div className="col-name">{client.full_name || 'Sin nombre'}</div>
                  <div className="col-email">{client.email || 'Sin email'}</div>
                  <div className="col-phone">{client.phone || 'Sin teléfono'}</div>
                  <div className="col-actions">
                    <button 
                      className="btn-delete"
                      onClick={() => handleDeleteClick(client.id, client.full_name || 'cliente')}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Crear Nuevo Cliente</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={newClient.full_name}
                  onChange={(e) => setNewClient({...newClient, full_name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {clientToDelete && (
        <div className="modal-overlay" onClick={() => setClientToDelete(null)}>
          <div className="modal modal-confirm-delete" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-warning">
              <AlertTriangle size={32} />
            </div>
            <h2>Confirmar Eliminación</h2>
            <p style={{ margin: '1.5rem 0', textAlign: 'center', fontSize: '1.1rem', color: 'var(--text-main)' }}>
              ¿Estás seguro de que deseas eliminar al cliente <strong>{clientToDelete.name}</strong>?
            </p>
            <p style={{ margin: '0.5rem 0 1.5rem 0', textAlign: 'center', fontSize: '0.9rem', color: '#dc2626', fontWeight: 500 }}>
              Esta acción eliminará el perfil del cliente del sistema.
            </p>
            <div className="modal-actions">
              <button type="button" onClick={() => setClientToDelete(null)}>
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn-primary btn-confirm-delete"
                onClick={confirmDelete}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

export default ManageClientsPage
