import { useState, useEffect, useContext } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { MainLayout } from '../../layouts/MainLayout'
import { User, Calendar as CalendarIcon, Crown } from 'lucide-react'
import { profilesService } from '../../services/supabase/profiles.service'
import { appointmentsService } from '../../services/supabase/appointments.service'
import { AuthContext } from '../../context/AuthContext'
import Loader from '../../components/Loader/Loader'
import './CalendarPage.css'

const CalendarPage = () => {
  const [agents, setAgents] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useContext(AuthContext)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedHour, setSelectedHour] = useState('')
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [availableAgents, setAvailableAgents] = useState([])
  const [availableHours, setAvailableHours] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const START_HOUR = 8
  const END_HOUR = 18

  const isAdmin = user?.user_metadata?.role === 'admin' || user?.email === 'admin@test.com'
  const userEmail = user?.email?.toLowerCase()

  const getOccupiedHoursForDate = (date, agentId) => {
    const dateStr = date.toISOString().split('T')[0]
    return appointments
      .filter(app => {
        if (agentId && app.agent_id !== agentId) return false
        const appDate = new Date(app.start_time || app.start).toISOString().split('T')[0]
        return appDate === dateStr
      })
      .map(app => {
        const appDate = new Date(app.start_time || app.start)
        return appDate.getHours()
      })
  }

  const getAvailableHours = (date, agentId) => {
    const occupiedHours = getOccupiedHoursForDate(date, agentId)
    const hours = []
    for (let h = START_HOUR; h < END_HOUR; h++) {
      if (!occupiedHours.includes(h)) {
        hours.push({
          value: h,
          label: `${h.toString().padStart(2, '0')}:00 - ${(h + 1).toString().padStart(2, '0')}:00`
        })
      }
    }
    return hours
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (agents.length > 0) {
      setAvailableAgents(agents)
      if (!selectedAgentId) {
        setSelectedAgentId(agents[0].id)
      }
    }
  }, [agents])

  useEffect(() => {
    if (isModalOpen && selectedDate && selectedAgentId) {
      const hours = getAvailableHours(selectedDate, selectedAgentId)
      setAvailableHours(hours)
    }
  }, [isModalOpen, selectedDate, selectedAgentId, appointments])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [fetchedAgents, fetchedAppointments] = await Promise.all([
        profilesService.getAgents(),
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
    const { start } = selectInfo
    
    const selectedDate = new Date(start)
    selectedDate.setHours(0, 0, 0, 0)
    
    setSelectedDate(selectedDate)
    setAvailableAgents(agents)
    setSelectedAgentId(agents.length > 0 ? agents[0].id : '')
    setIsModalOpen(true)
  }

  const handleAgentChange = (e) => {
    const newAgentId = e.target.value
    setSelectedAgentId(newAgentId)
    setSelectedHour('')
    if (selectedDate) {
      const hours = getAvailableHours(selectedDate, newAgentId)
      setAvailableHours(hours)
    }
  }

  const handleConfirmReservation = async () => {
    if (!selectedAgentId || !selectedDate || !selectedHour) return

    try {
      setIsSubmitting(true)
      
      const startDateTime = new Date(selectedDate)
      startDateTime.setHours(parseInt(selectedHour), 0, 0, 0)
      
      const endDateTime = new Date(selectedDate)
      endDateTime.setHours(parseInt(selectedHour) + 1, 0, 0, 0)

      const newAppointment = {
        agent_id: selectedAgentId,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        created_by: user.id,
        client_name: user.user_metadata?.full_name || user.email || 'Cliente',
        title: 'Cita Reservada'
      }

      await appointmentsService.create(newAppointment)
      
      await fetchData()
      setIsModalOpen(false)
      setSelectedDate(null)
      setSelectedAgentId('')
      setSelectedHour('')
      setAvailableHours([])
    } catch (error) {
      console.error('Error creating appointment:', error)
      alert('Error al crear la cita. Por favor intente de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedDate(null)
    setSelectedAgentId('')
    setSelectedHour('')
    setAvailableHours([])
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
          <h2>{isAdmin ? 'Agendas de Agentes' : 'Mi Calendario'}</h2>
          <p>{isAdmin ? 'Visualiza y gestiona las citas de todos los agentes del sistema.' : 'Visualiza y gestiona tus citas programadas.'}</p>
        </header>

        {agents.length === 0 && !isAdmin ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
            <CalendarIcon size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>No hay agentes registrados en la base de datos.</p>
          </div>
        ) : (
          <div className="calendars-grid">

            {agents
              .filter(agent => {
                // Admin ve todos los agentes; un agente solo se ve a sí mismo
                if (isAdmin) return true
                return (
                  agent.id === user?.id ||
                  agent.email?.toLowerCase() === userEmail ||
                  agent.user_id === user?.id
                )
              })
              .map(agent => (
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
                  editable={false}
                  droppable={false}
                  selectable={false}
                  height="auto"
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
