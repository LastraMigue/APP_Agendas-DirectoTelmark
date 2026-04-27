import { useState, useEffect, useContext } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { MainLayout } from '../../layouts/MainLayout'
import { User, Calendar as CalendarIcon, Crown } from 'lucide-react'
import { agentsService } from '../../services/supabase/agents.service'
import { appointmentsService } from '../../services/supabase/appointments.service'
import { AuthContext } from '../../context/AuthContext'
import Loader from '../../components/common/Loader/Loader'
import './CalendarPage.css'

const CalendarPage = () => {
  const [agents, setAgents] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useContext(AuthContext)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRange, setSelectedRange] = useState(null)
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [availableAgents, setAvailableAgents] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isAdmin = user?.email === 'admin@test.com'

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [fetchedAgents, fetchedAppointments] = await Promise.all([
        agentsService.getAll(),
        appointmentsService.getAll()
      ])
      
      setAgents(fetchedAgents || [])
      setAppointments(fetchedAppointments || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      setAgents([])
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const getAdminEvents = () => {
    if (!isAdmin) return []
    return appointments
      .filter(app => app.created_by === user.id)
      .map(app => ({
        id: app.id,
        title: app.client_name || app.title || 'Cita Programada',
        start: app.start_time || app.start,
        end: app.end_time || app.end,
        allDay: false
      }))
  }

  const handleEventDrop = async (dropInfo) => {
    const { event } = dropInfo
    const updatedAppointment = {
      // Intentamos usar los nombres de columnas comunes en caso de duda
      start_time: event.start.toISOString(),
      end_time: event.end ? event.end.toISOString() : event.start.toISOString()
    }
    
    try {
      await appointmentsService.update(event.id, updatedAppointment)
    } catch (error) {
      console.error('Error updating appointment date:', error)
      dropInfo.revert() // Revertimos si hay un error al actualizar en base de datos
    }
  }

  const getAgentEvents = (agentId) => {
    return appointments
      .filter(app => app.agent_id === agentId)
      .map(app => ({
        id: app.id,
        title: app.client_name || app.title || 'Cita Programada',
        start: app.start_time || app.start,
        end: app.end_time || app.end,
        allDay: false // asumiendo que tienen hora
      }))
  }

  const handleDateSelect = (selectInfo) => {
    const { start, end } = selectInfo
    setSelectedRange({ start, end })

    const startMs = start.getTime()
    const endMs = end.getTime()

    const freeAgents = agents.filter(agent => {
      const agentApps = appointments.filter(app => app.agent_id === agent.id)
      
      const hasOverlap = agentApps.some(app => {
        const appStart = new Date(app.start_time || app.start).getTime()
        const appEnd = new Date(app.end_time || app.end).getTime()
        
        return (appStart < endMs) && (appEnd > startMs)
      })

      return !hasOverlap
    })

    setAvailableAgents(freeAgents)
    setSelectedAgentId(freeAgents.length > 0 ? freeAgents[0].id : '')
    setIsModalOpen(true)
  }

  const handleConfirmReservation = async () => {
    if (!selectedAgentId || !selectedRange) return

    try {
      setIsSubmitting(true)
      const newAppointment = {
        agent_id: selectedAgentId,
        start_time: selectedRange.start.toISOString(),
        end_time: selectedRange.end.toISOString(),
        created_by: user.id,
        client_name: user.user_metadata?.full_name || user.email || 'Cliente',
        title: 'Cita Reservada'
      }

      await appointmentsService.create(newAppointment)
      
      await fetchData()
      setIsModalOpen(false)
      setSelectedRange(null)
      setSelectedAgentId('')
    } catch (error) {
      console.error('Error creating appointment:', error)
      alert('Error al crear la cita. Por favor intente de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedRange(null)
    setSelectedAgentId('')
  }

  if (loading) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
          <Loader text="Cargando calendarios..." />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="agents-calendars-container">
        <header className="agents-calendars-header">
          <h2>Agendas de Agentes</h2>
          <p>Visualiza y gestiona las citas de todos los agentes del sistema.</p>
        </header>

        {agents.length === 0 && !isAdmin ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
            <CalendarIcon size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>No hay agentes registrados en la base de datos.</p>
          </div>
        ) : (
          <div className="calendars-grid">
            {isAdmin && (
              <div key="admin-calendar" className="agent-calendar-card">
                <h3><Crown size={20} className="agent-icon" color="#F59E0B" /> Admin (Tú)</h3>
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                  }}
                  buttonText={{
                    today: 'Hoy',
                    month: 'Mes',
                    week: 'Semana',
                    day: 'Día',
                    list: 'Lista'
                  }}
                  events={getAdminEvents()}
                  editable={true}
                  droppable={true}
                  selectable={true}
                  select={handleDateSelect}
                  eventDrop={handleEventDrop}
                  eventResize={handleEventDrop}
                  height="auto"
                />
              </div>
            )}
            {agents.map(agent => (
              <div key={agent.id} className="agent-calendar-card">
                <h3><User size={20} className="agent-icon" color="var(--primary)" /> {agent.name || agent.full_name || agent.email || 'Agente Desconocido'}</h3>
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                  }}
                  buttonText={{
                    today: 'Hoy',
                    month: 'Mes',
                    week: 'Semana',
                    day: 'Día',
                    list: 'Lista'
                  }}
                  events={getAgentEvents(agent.id)}
                  editable={true} // Permite mover las citas (drag & drop)
                  droppable={true}
                  selectable={true}
                  select={handleDateSelect}
                  eventDrop={handleEventDrop}
                  eventResize={handleEventDrop} // Permite estirar para cambiar duración
                  height="auto" // Ajusta la altura automáticamente
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="reservation-modal-overlay">
          <div className="reservation-modal">
            <h3>Reservar Cita</h3>
            <div className="reservation-details">
              <p><strong>Inicio:</strong> {selectedRange?.start.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
              <p><strong>Fin:</strong> {selectedRange?.end.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
            </div>
            
            <div className="reservation-form">
              <label>Agente Disponible:</label>
              {availableAgents.length > 0 ? (
                <select 
                  value={selectedAgentId} 
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="agent-select"
                >
                  {availableAgents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name || agent.full_name || agent.email}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="no-agents-error">No hay agentes disponibles para este horario.</p>
              )}
            </div>

            <div className="reservation-actions">
              <button 
                className="btn-cancel" 
                onClick={handleCloseModal}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button 
                className="btn-confirm" 
                onClick={handleConfirmReservation}
                disabled={availableAgents.length === 0 || isSubmitting}
              >
                {isSubmitting ? 'Confirmando...' : 'Confirmar Reserva'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

export default CalendarPage
