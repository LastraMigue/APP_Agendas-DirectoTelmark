import { useState, useEffect, useContext, useMemo } from 'react'
import { MainLayout } from '../../layouts/MainLayout'
import { AuthContext } from '../../context/AuthContext'
import { supabase } from '../../services/supabase/client'
import { appointmentsService } from '../../services/supabase/appointments.service'
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle, CalendarDays } from 'lucide-react'
import Loader from '../../components/common/Loader/Loader'
import './AgentAppointmentsPage.css'

const AgentAppointmentsPage = () => {
  const { user } = useContext(AuthContext)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [agentId, setAgentId] = useState(null)
  const [activeTab, setActiveTab] = useState('upcoming') // 'upcoming' or 'past'

  useEffect(() => {
    const fetchAgentAndAppointments = async () => {
      setLoading(true)
      try {
        if (user) {
          // Find agent id
          const { data: agentData } = await supabase
            .from('agents')
            .select('id')
            .eq('email', user.email)
            .maybeSingle()
          
          let currentAgentId = agentData?.id

          if (!currentAgentId) {
            // Fallback: Check if agent.id matches user.id
            const { data: agentById } = await supabase
              .from('agents')
              .select('id')
              .eq('id', user.id)
              .maybeSingle()
            currentAgentId = agentById?.id
          }

          if (currentAgentId) {
            setAgentId(currentAgentId)
            const allAppointments = await appointmentsService.getAll()
            
            // Filter appointments for this agent
            const agentAppointments = allAppointments.filter(app => app.agent_id === currentAgentId)
            setAppointments(agentAppointments)
          } else {
            console.warn('No agent record found for this user.')
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

  const { upcoming, past } = useMemo(() => {
    const now = new Date()
    const upcomingList = []
    const pastList = []

    appointments.forEach(app => {
      const appDate = new Date(app.start_time)
      if (appDate >= now && app.status !== 'cancelled') {
        upcomingList.push(app)
      } else {
        pastList.push(app)
      }
    })

    upcomingList.sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
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

  const getStatusBadge = (status, endTimeStr) => {
    const isPast = new Date(endTimeStr) < new Date()
    if (status === 'cancelled') {
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
            <h1>Historial de Citas</h1>
            <p>Gestiona tus citas programadas y revisa tu historial</p>
          </div>
        </header>

        {!agentId ? (
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
                        return (
                          <div key={app.id} className="appointment-card upcoming">
                            <div className="card-header">
                              {getStatusBadge(app.status, app.end_time)}
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
                            </div>
                            {app.description && (
                              <p className="card-description">{app.description}</p>
                            )}
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
                        return (
                          <div key={app.id} className="appointment-card past">
                            <div className="card-header">
                              {getStatusBadge(app.status, app.end_time)}
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
                            </div>
                            {app.description && (
                              <p className="card-description">{app.description}</p>
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
