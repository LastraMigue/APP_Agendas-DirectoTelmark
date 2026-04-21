import { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { MainLayout } from '../../layouts/MainLayout'
import { User, Calendar as CalendarIcon } from 'lucide-react'
import { agentsService } from '../../services/supabase/agents.service'
import { appointmentsService } from '../../services/supabase/appointments.service'
import Loader from '../../components/common/Loader/Loader'
import './CalendarPage.css'

const CalendarPage = () => {
  const [agents, setAgents] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

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

        {agents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
            <CalendarIcon size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>No hay agentes registrados en la base de datos.</p>
          </div>
        ) : (
          <div className="calendars-grid">
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
                  eventDrop={handleEventDrop}
                  eventResize={handleEventDrop} // Permite estirar para cambiar duración
                  height="auto" // Ajusta la altura automáticamente
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default CalendarPage
