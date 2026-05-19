import { useState, useEffect, useCallback } from 'react'
import { MainLayout } from '../../layouts/MainLayout'
import { profilesService } from '../../services/supabase/profiles.service'
import { Users, AlertTriangle } from 'lucide-react'
import Loader from '../../components/Loader/Loader'
import '../ManageClientsPage/ManageClientsPage.css'

const ManageAgentsPage = () => {
  const [agents, setAgents] = useState([])
  const [filteredAgents, setFilteredAgents] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newAgent, setNewAgent] = useState({ full_name: '', email: '', phone: '' })
  const [agentToDelete, setAgentToDelete] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true)
      const data = await profilesService.getAgents()
      setAgents(data || [])
      setFilteredAgents(data || [])
    } catch (err) {
      setError('Error al cargar agentes: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredAgents(agents)
      return
    }
    const term = searchTerm.toLowerCase()
    const filtered = agents.filter(agent => 
      (agent.full_name && agent.full_name.toLowerCase().includes(term)) ||
      (agent.email && agent.email.toLowerCase().includes(term)) ||
      (agent.phone && agent.phone.includes(term))
    )
    setFilteredAgents(filtered)
  }, [searchTerm, agents])

  const handleDeleteClick = (id, name) => {
    setAgentToDelete({ id, name })
  }

  const confirmDelete = async () => {
    if (!agentToDelete) return
    const { id, name } = agentToDelete
    setAgentToDelete(null)

    setError('')
    setSuccess('')

    try {
      const count = await profilesService.delete(id)
      if (count === 0) {
        setError('No se pudo eliminar el agente. Es posible que no tengas permisos (RLS) o que el agente ya no exista.')
      } else {
        setSuccess('Agente eliminado correctamente')
        fetchAgents()
      }
    } catch (err) {
      if (err.code === '23503') {
        setError('No se puede eliminar el agente porque tiene citas o registros asociados. Elimina primero sus citas.')
      } else {
        setError('Error al eliminar: ' + (err.message || 'Error desconocido'))
      }
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!newAgent.full_name || !newAgent.email) {
      setError('Nombre y email son obligatorios')
      return
    }

    try {
      await profilesService.create({ ...newAgent, role: 'agent' })
      setSuccess('Agente creado correctamente')
      setNewAgent({ full_name: '', email: '', phone: '' })
      setShowCreateModal(false)
      fetchAgents()
    } catch (err) {
      setError('Error al crear agente: ' + err.message)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
          <Loader text="Cargando agentes..." />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="manage-clients-container">
        <header className="manage-clients-header">
          <h2><Users size={28} className="header-icon" /> Gestión de Agentes</h2>
          <p>Administra los agentes registrados en el sistema</p>
        </header>

        <div className="manage-clients-card">
          <div className="card-header">
            <h3>Listado de Agentes</h3>
            <button className="btn-create" onClick={() => setShowCreateModal(true)}>
              + Nuevo Agente
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
            {filteredAgents.length === 0 ? (
              <div className="no-results">No se encontraron agentes</div>
            ) : (
              filteredAgents.map(agent => (
                <div key={agent.id} className="table-row">
                  <div className="col-name">{agent.full_name || 'Sin nombre'}</div>
                  <div className="col-email">{agent.email || 'Sin email'}</div>
                  <div className="col-phone">{agent.phone || 'Sin teléfono'}</div>
                  <div className="col-actions">
                    <button 
                      className="btn-delete"
                      onClick={() => handleDeleteClick(agent.id, agent.full_name || 'agente')}
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
            <h2>Crear Nuevo Agente</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={newAgent.full_name}
                  onChange={(e) => setNewAgent({...newAgent, full_name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={newAgent.email}
                  onChange={(e) => setNewAgent({...newAgent, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  value={newAgent.phone}
                  onChange={(e) => setNewAgent({...newAgent, phone: e.target.value})}
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

      {agentToDelete && (
        <div className="modal-overlay" onClick={() => setAgentToDelete(null)}>
          <div className="modal modal-confirm-delete" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-warning">
              <AlertTriangle size={32} />
            </div>
            <h2>Confirmar Eliminación</h2>
            <p style={{ margin: '1.5rem 0', textAlign: 'center', fontSize: '1.1rem', color: 'var(--text-main)' }}>
              ¿Estás seguro de que deseas eliminar al agente <strong>{agentToDelete.name}</strong>?
            </p>
            <p style={{ margin: '0.5rem 0 1.5rem 0', textAlign: 'center', fontSize: '0.9rem', color: '#dc2626', fontWeight: 500 }}>
              Esta acción eliminará el perfil del agente del sistema.
            </p>
            <div className="modal-actions">
              <button type="button" onClick={() => setAgentToDelete(null)}>
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

export default ManageAgentsPage
