import { useState, useEffect, useContext, useMemo } from 'react'
import { MainLayout } from '../../layouts/MainLayout'
import { AuthContext } from '../../context/AuthContext'
import { supabase } from '../../services/supabase/client'
import { appointmentsService } from '../../services/supabase/appointments.service'
import { profilesService } from '../../services/supabase/profiles.service'
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle, CalendarDays, UserSquare2 } from 'lucide-react'
import Loader from '../../components/Loader/Loader'
import '../AgentAppointmentsPage/AgentAppointmentsPage.css' // Reusing the same CSS for consistent UI

const ClientAppointmentsPage = () => {
  const { user } = useContext(AuthContext)
  const [appointments, setAppointments] = useState([])
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [clientId, setClientId] = useState(null)
  const [activeTab, setActiveTab] = useState('upcoming') // 'upcoming' or 'past'

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        if (user) {
          // Buscamos el perfil en la nueva tabla profiles
          let { data: profileData } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .eq('role', 'client')
            .maybeSingle()
          
          if (!profileData && user.email) {
            // Si no lo encuentra por ID (común tras migración), buscamos por email
            const { data: profileByEmail } = await supabase
              .from('profiles')
              .select('id')
              .eq('email', user.email.toLowerCase())
              .eq('role', 'client')
              .maybeSingle()
            profileData = profileByEmail
          }
          
          let currentClientId = profileData?.id

          if (currentClientId) {
            setClientId(currentClientId)
            const [allAppointments, allStaff] = await Promise.all([
              appointmentsService.getAll(),
              profilesService.getStaff()
            ])
            
            // Filtramos citas para este cliente
            const clientAppointments = allAppointments.filter(app => app.client_id === currentClientId)
            setAppointments(clientAppointments)
            setAgents(allStaff)
          } else {
            console.warn('No se encontró un perfil de cliente para este usuario.')
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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

  const { upcoming, past } = useMemo(() => {
    const now = new Date()
    const upcomingList = []
    const pastList = []

    appointments.forEach(app => {
      const appDate = new Date(app.start_time)
      const isCancelled = app.description && app.description.includes('[Cancelada]')
      if (appDate >= now && !isCancelled) {
        upcomingList.push(app)
      } else {
        pastList.push(app)
      }
    })

    // Sort upcoming ascending (nearest first)
    upcomingList.sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    // Sort past descending (most recent first)
    pastList.sort((a, b) => new Date(b.start_time) - new Date(a.start_time))

    return { upcoming: upcomingList, past: pastList }
  }, [appointments])

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }),
      time: date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    }
  }

  const getAgentName = (agentId) => {
    const agent = agents.find(a => a.id === agentId)
    return agent ? agent.full_name : 'Agente Desconocido'
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
        <header className="page-header">
          <div>
            <h1>Mis Citas</h1>
            <p>Revisa el historial de tus citas y tus próximas reservas</p>
          </div>
        </header>

        {!clientId ? (
          <div className="no-agent-alert">
            <AlertCircle size={48} color="#ef4444" />
            <h2>No tienes un perfil de cliente asignado</h2>
            <p>Por favor, contacta con soporte para solucionar este problema.</p>
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
                Historial de Citas <span className="badge">{past.length}</span>
              </button>
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
                              <div className="detail-item">
                                <UserSquare2 size={18} />
                                <span>Con agente: <strong>{getAgentName(app.agent_id)}</strong></span>
                              </div>
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
                              <div className="detail-item">
                                <UserSquare2 size={18} />
                                <span>Con agente: <strong>{getAgentName(app.agent_id)}</strong></span>
                              </div>
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

export default ClientAppointmentsPage
