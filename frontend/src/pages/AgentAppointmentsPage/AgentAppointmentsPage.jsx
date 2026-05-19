import { useState, useEffect, useContext, useMemo } from 'react'
import { MainLayout } from '../../layouts/MainLayout'
import { AuthContext } from '../../context/AuthContext'
import { supabase } from '../../services/supabase/client'
import { appointmentsService } from '../../services/supabase/appointments.service'
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle, CalendarDays, UserSquare2 } from 'lucide-react'
import Loader from '../../components/Loader/Loader'
import './AgentAppointmentsPage.css'

const AgentAppointmentsPage = () => {
  const { user } = useContext(AuthContext)
  const [appointments, setAppointments] = useState([])
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [agentId, setAgentId] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [selectedFilterAgentId, setSelectedFilterAgentId] = useState('')
  const [activeTab, setActiveTab] = useState('upcoming') // 'upcoming' or 'past'
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchAgentAndAppointments = async () => {
      setLoading(true)
      try {
        if (user) {
          // Fetch staff list to map names
          const { data: agentsData } = await supabase
            .from('profiles')
            .select('*')
            .in('role', ['agent', 'admin', 'supervisor'])
          setAgents(agentsData || [])

          // Buscamos el perfil del usuario actual en la tabla profiles
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, role')
            .eq('id', user.id)
            .maybeSingle()

          const userRole = profileData?.role || (user.email === 'admin@test.com' ? 'admin' : 'agente')
          const currentAgentId = profileData?.id
          const isUserAdmin = userRole === 'admin' || userRole === 'supervisor'
          setIsAdmin(isUserAdmin)

          const allAppointments = await appointmentsService.getAll()

          if (isUserAdmin) {
            setAppointments(allAppointments)
            setSelectedFilterAgentId(user.id)
          } else if (currentAgentId) {
            setAgentId(currentAgentId)
            // Filtramos las citas de este agente
            const agentAppointments = allAppointments.filter(app => app.agent_id === currentAgentId)
            setAppointments(agentAppointments)
          } else {
            console.warn('No se encontró un perfil de agente para este usuario.')
          }
        }
      } catch (error) {
        console.error('Error fetching appointments:', error)
      } finally {
        setLoading(false)
      }
    }



    fetchAgentAndAppointments()
  }, [user])

  const handleCancel = async (id, currentDescription) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta cita?')) return
    try {
      const newDescription = currentDescription 
        ? `${currentDescription} [Cancelada]` 
        : '[Cancelada]'
      
      await appointmentsService.update(id, { description: newDescription })
      
      // Update local state
      setAppointments(prev => prev.map(app => 
        app.id === id ? { ...app, description: newDescription } : app
      ))
    } catch (error) {
      console.error('Error al cancelar la cita:', error)
      alert('Error al cancelar la cita: ' + (error.message || error))
    }
  }

  const getAgentName = (agentId) => {
    const agent = agents.find(a => a.id === agentId)
    return agent ? agent.full_name : 'Agente Desconocido'
  }

  const { upcoming, past } = useMemo(() => {
    const now = new Date()
    const upcomingList = []
    const pastList = []

    let apps = appointments
    if (isAdmin && selectedFilterAgentId) {
      apps = appointments.filter(app => app.agent_id === selectedFilterAgentId)
    }

    const filteredApps = searchTerm
      ? apps.filter(app => {
          const searchLower = searchTerm.toLowerCase()
          
          const date = new Date(app.start_time)
          const dateStr = date.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).toLowerCase()
          const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }).toLowerCase()

          const title = (app.title || '').toLowerCase()
          const description = (app.description || '').toLowerCase()
          const agentName = getAgentName(app.agent_id).toLowerCase()
          
          const isPast = new Date(app.end_time) < now
          const isCancelled = app.description && app.description.includes('[Cancelada]')
          let friendlyStatus = 'programada'
          if (isCancelled) {
            friendlyStatus = 'cancelada'
          } else if (isPast) {
            friendlyStatus = 'completada'
          }

          return (
            title.includes(searchLower) ||
            description.includes(searchLower) ||
            friendlyStatus.includes(searchLower) ||
            dateStr.includes(searchLower) ||
            timeStr.includes(searchLower) ||
            agentName.includes(searchLower)
          )
        })
      : apps

    filteredApps.forEach(app => {
      const appDate = new Date(app.start_time)
      const isCancelled = app.description && app.description.includes('[Cancelada]')
      if (appDate >= now && !isCancelled) {
        upcomingList.push(app)
      } else {
        pastList.push(app)
      }
    })

    upcomingList.sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    pastList.sort((a, b) => new Date(b.start_time) - new Date(a.start_time))

    return { upcoming: upcomingList, past: pastList }
  }, [appointments, searchTerm, agents, isAdmin, selectedFilterAgentId])

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }),
      time: date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    }
  }

  const getStatusBadge = (description, endTimeStr) => {
    const isPast = new Date(endTimeStr) < new Date()
    const isCancelled = description && description.includes('[Cancelada]')
    if (isCancelled) {
      return <span className="status-badge cancelled"><XCircle size={14} /> Cancelada</span>
    }
    if (isPast) {
      return <span className="status-badge completed"><CheckCircle2 size={14} /> Completada</span>
    }
    return <span className="status-badge scheduled"><CalendarDays size={14} /> Programada</span>
  }


  if (loading) {
    return (
      <MainLayout>
        <div className="agent-appointments-loader">
          <Loader text="Cargando tus citas..." />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="agent-appointments-container">
        <header className="manage-clients-header">
          <h2>Historial de Citas</h2>
          <p>Gestiona tus citas programadas y revisa tu historial.</p>
        </header>

        {isAdmin && (
          <div className="agent-selector-container">
            <label htmlFor="active-agent-select"><strong>Seleccionar Agente: </strong></label>
            <select
              id="active-agent-select"
              value={selectedFilterAgentId}
              onChange={(e) => setSelectedFilterAgentId(e.target.value)}
              className="agent-select"
            >
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.full_name || agent.name || agent.email} {agent.id === user?.id ? '(Tú)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {!agentId && !isAdmin ? (
          <div className="no-agent-alert">

            <AlertCircle size={48} color="#ef4444" />
            <h2>No tienes un perfil de agente asignado</h2>
            <p>Por favor, contacta con un administrador para configurar tu perfil.</p>
          </div>
        ) : (
          <div className="appointments-content">
            <div className="tabs">
              <button
                className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
                onClick={() => setActiveTab('upcoming')}
              >
                Próximas Citas <span className="badge">{upcoming.length}</span>
              </button>
              <button
                className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`}
                onClick={() => setActiveTab('past')}
              >
                Citas Pasadas <span className="badge">{past.length}</span>
              </button>
            </div>
            <div className="card-divider"></div>

            <div className="search-bar">
              <input
                type="text"
                placeholder="Buscar por título de cita, fecha, descripción, estado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="appointments-list">
              {activeTab === 'upcoming' && (
                <>
                  {upcoming.length === 0 ? (
                    <div className="empty-state">
                      <Calendar size={48} />
                      <p>No tienes citas programadas próximamente.</p>
                    </div>
                  ) : (
                    <div className="cards-grid">
                      {upcoming.map(app => {
                        const { date, time } = formatDateTime(app.start_time)
                        const cleanDesc = (app.description || '')
                          .replace('[Cancelada]', '')
                          .replace('[Reprogramada]', '')
                          .replace('Cita reservada por el cliente desde la web.', '')
                          .trim()
                        return (
                          <div key={app.id} className="appointment-card upcoming">
                            <div className="card-header">
                              {getStatusBadge(app.description, app.end_time)}
                            </div>
                            <h3 className="card-title">{app.title || 'Cita Programada'}</h3>
                            <div className="card-details">
                              <div className="detail-item">
                                <Calendar size={18} />
                                <span style={{ textTransform: 'capitalize' }}>{date}</span>
                              </div>
                              <div className="detail-item">
                                <Clock size={18} />
                                <span>{time}</span>
                              </div>
                              {isAdmin && (
                                <div className="detail-item">
                                  <UserSquare2 size={18} />
                                  <span>Agente: <strong>{getAgentName(app.agent_id)}</strong></span>
                                </div>
                              )}
                            </div>

                            {cleanDesc && (
                              <p className="card-description">{cleanDesc}</p>
                            )}
                            <button
                              onClick={() => handleCancel(app.id, app.description)}
                              className="btn-cancel-appointment"
                            >
                              Cancelar Cita
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'past' && (
                <>
                  {past.length === 0 ? (
                    <div className="empty-state">
                      <Clock size={48} />
                      <p>No hay registro de citas pasadas.</p>
                    </div>
                  ) : (
                    <div className="cards-grid">
                      {past.map(app => {
                        const { date, time } = formatDateTime(app.start_time)
                        const cleanDesc = (app.description || '')
                          .replace('[Cancelada]', '')
                          .replace('[Reprogramada]', '')
                          .replace('Cita reservada por el cliente desde la web.', '')
                          .trim()
                        return (
                          <div key={app.id} className="appointment-card past">
                            <div className="card-header">
                              {getStatusBadge(app.description, app.end_time)}
                            </div>
                            <h3 className="card-title">{app.title || 'Cita Programada'}</h3>
                            <div className="card-details">
                              <div className="detail-item">
                                <Calendar size={18} />
                                <span style={{ textTransform: 'capitalize' }}>{date}</span>
                              </div>
                              <div className="detail-item">
                                <Clock size={18} />
                                <span>{time}</span>
                              </div>
                              {isAdmin && (
                                <div className="detail-item">
                                  <UserSquare2 size={18} />
                                  <span>Agente: <strong>{getAgentName(app.agent_id)}</strong></span>
                                </div>
                              )}
                            </div>

                            {cleanDesc && (
                              <p className="card-description">{cleanDesc}</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default AgentAppointmentsPage
