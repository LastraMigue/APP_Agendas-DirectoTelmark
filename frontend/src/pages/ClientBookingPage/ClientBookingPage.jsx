import { useState, useEffect, useContext, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import { MainLayout } from '../../layouts/MainLayout'
import { User, Calendar as CalendarIcon, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { profilesService } from '../../services/supabase/profiles.service'
import { appointmentsService } from '../../services/supabase/appointments.service'
import { supabase } from '../../services/supabase/client'
import { AuthContext } from '../../context/AuthContext'
import Loader from '../../components/Loader/Loader'
import '../CalendarPage/CalendarPage.css' 

const ClientBookingPage = () => {
  const [agents, setAgents] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [clientId, setClientId] = useState(null)
  const { user } = useContext(AuthContext)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [availableSlots, setAvailableSlots] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const START_HOUR = 8
  const END_HOUR = 18
  const SLOT_DURATION = 30 // minutes

  // Helper to get local date string YYYY-MM-DD
  const getLocalDateString = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const year = d.getFullYear()
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  useEffect(() => {
    const initData = async () => {
      setLoading(true)
      try {
        if (user) {
          // Buscamos el perfil en la nueva tabla profiles
          const profile = await profilesService.getById(user.id)
          if (profile) {
            setClientId(profile.id)
          } else if (user.email) {
            const profileByEmail = await profilesService.getByEmail(user.email)
            if (profileByEmail) setClientId(profileByEmail.id)
          }
        }
        await fetchData()
      } catch (error) {
        console.error('Error during init:', error)
      } finally {
        setLoading(false)
      }
    }
    initData()
  }, [user])

  const fetchData = async () => {
    try {
      console.log('Cargando personal (agentes y admins) y citas...');
      const [fetchedAgents, fetchedAdmins, fetchedAppointments] = await Promise.all([
        profilesService.getAgents(),
        profilesService.getAdmins(),
        appointmentsService.getAll()
      ])
      
      const allStaff = [...(fetchedAgents || []), ...(fetchedAdmins || [])]
      
      console.log('Datos cargados:', { 
        staff: allStaff.length, 
        citas: fetchedAppointments?.length 
      })
      setAgents(allStaff)
      setAppointments(fetchedAppointments || [])
    } catch (error) {
      console.error('ERROR AL CARGAR DATOS (500?):', error)
    }
  }

  const myAppointments = useMemo(() => {
    if (!clientId) return []
    return appointments.filter(app => app.client_id === clientId && app.status !== 'cancelled')
  }, [appointments, clientId])

  const calendarEvents = useMemo(() => {
    return myAppointments.map(app => ({
      id: app.id,
      title: 'Cita Reservada',
      start: app.start_time,
      end: app.end_time,
      backgroundColor: '#10B981',
      borderColor: '#059669'
    }))
  }, [myAppointments])

  const getOccupiedSlotsForDate = (date, agentId) => {
    if (!date || !agentId) return []
    const dateStr = getLocalDateString(date)
    
    return appointments
      .filter(app => {
        if (app.status === 'cancelled') return false
        const appDateStr = getLocalDateString(new Date(app.start_time))
        return appDateStr === dateStr
      })
      .map(app => {
        const appDate = new Date(app.start_time)
        return `${appDate.getHours().toString().padStart(2, '0')}:${appDate.getMinutes().toString().padStart(2, '0')}`
      })
  }

  const getAvailableSlots = (date) => {
    if (!date) return []
    
    const occupiedSlots = getOccupiedSlotsForDate(date)
    const slots = []
    const now = new Date()
    const isToday = getLocalDateString(date) === getLocalDateString(now)

    for (let hour = START_HOUR; hour < END_HOUR; hour++) {
      for (let min = 0; min < 60; min += SLOT_DURATION) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
        
        if (isToday) {
          const slotTime = new Date(date)
          slotTime.setHours(hour, min, 0, 0)
          if (slotTime <= now) continue
        }

        if (!occupiedSlots.includes(timeStr)) {
          slots.push(timeStr)
        }
      }
    }
    return slots
  }

  const handleDateClick = (arg) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const clickedDate = new Date(arg.date)
    
    if (clickedDate < today) {
      alert('No puedes reservar citas en fechas pasadas.')
      return
    }

    setSelectedDate(clickedDate)
    setSelectedAgentId('')
    setSelectedSlot('')
    setAvailableSlots([])
    setIsModalOpen(true)
    setSuccess(false)
    setError(null)
  }

  const handleAgentChange = (e) => {
    const agentId = e.target.value
    setSelectedAgentId(agentId)
    setSelectedSlot('')
    if (selectedDate) {
      const slots = getAvailableSlots(selectedDate)
      setAvailableSlots(slots)
    }
  }

  const handleConfirmBooking = async () => {
    if (!selectedAgentId || !selectedDate || !selectedSlot) return

    // Validación: Solo una cita por día
    const dateStr = getLocalDateString(selectedDate)
    const hasAppToday = myAppointments.some(app => getLocalDateString(new Date(app.start_time)) === dateStr)
    
    if (hasAppToday) {
      setError('Ya tienes una cita programada para este día. Solo se permite una cita por día.')
      return
    }

    setError(null)

    try {
      setIsSubmitting(true)
      
      const [hour, min] = selectedSlot.split(':').map(Number)
      
      // Reconstruimos la fecha de forma explícita en hora local para evitar desfases de ISO
      const startDateTime = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        hour,
        min,
        0
      )
      
      const endDateTime = new Date(startDateTime)
      endDateTime.setMinutes(startDateTime.getMinutes() + SLOT_DURATION)

      const agent = agents.find(a => a.id === selectedAgentId)

      const newAppointment = {
        agent_id: selectedAgentId,
        client_id: clientId,
        title: `Cita con ${agent.full_name} a las ${selectedSlot}`,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: 'scheduled',
        description: 'Cita reservada por el cliente desde la web.'
      }

      await appointmentsService.create(newAppointment)
      
      setSuccess(true)
      await fetchData()
      setTimeout(() => {
        handleCloseModal()
      }, 2000)
    } catch (error) {
      console.error('Error creating appointment:', error)
      alert('Error al reservar la cita: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedDate(null)
    setSelectedAgentId('')
    setSelectedSlot('')
    setAvailableSlots([])
    setError(null)
  }

  const selectedDayAppointments = useMemo(() => {
    if (!selectedDate || !clientId) return []
    const dateStr = getLocalDateString(selectedDate)
    return myAppointments.filter(app => getLocalDateString(new Date(app.start_time)) === dateStr)
  }, [selectedDate, myAppointments, clientId])

  if (loading) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
          <Loader text="Cargando calendario de citas..." />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="agents-calendars-container">
        <header className="agents-calendars-header">
          <h2>Calendario de Citas</h2>
          <p>Horario de atención: 08:00 - 18:00 (Citas de 30 min)</p>
        </header>

        <div className="agent-calendar-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: ''
            }}
            locale={esLocale}
            buttonText={{
              today: 'Hoy'
            }}
            events={calendarEvents}
            dateClick={handleDateClick}
            height="auto"
            selectable={true}
          />
        </div>
      </div>

      {isModalOpen && (
        <div className="reservation-modal-overlay">
          <div className="reservation-modal">
            {success ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <CheckCircle2 size={64} color="#10B981" style={{ marginBottom: '1rem' }} />
                <h3 style={{ border: 'none' }}>¡Cita Reservada!</h3>
                <p>Tu cita ha sido confirmada con éxito.</p>
              </div>
            ) : (
              <>
                <h3>Reservar Cita</h3>
                <div className="reservation-details">
                  <p><strong>Fecha:</strong> {selectedDate?.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>

                {error && (
                  <div className="error-message" style={{ 
                    margin: '1rem 0', 
                    padding: '0.75rem', 
                    backgroundColor: '#fee2e2', 
                    color: '#dc2626', 
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    border: '1px solid #fecaca'
                  }}>
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </div>
                )}
                
                <div className="reservation-form">
                    <label>Selecciona un Agente:</label>
                    <select 
                      value={selectedAgentId} 
                      onChange={handleAgentChange}
                      className="agent-select"
                    >
                      <option value="">Selecciona un agente...</option>
                      {agents.map(agent => {
                        const freeSlots = getAvailableSlots(selectedDate).length
                        return (
                          <option key={agent.id} value={agent.id} disabled={freeSlots === 0}>
                            {agent.full_name} {freeSlots === 0 ? '(Lleno)' : `(${freeSlots} huecos)`}
                          </option>
                        )
                      })}
                    </select>

                    {selectedAgentId && (
                      <>
                        <label style={{ marginTop: '1rem' }}>Selecciona una Hora:</label>
                        {availableSlots.length > 0 ? (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem' }}>
                            {availableSlots.map(slot => (
                              <button
                                key={slot}
                                className={`slot-btn ${selectedSlot === slot ? 'selected' : ''}`}
                                onClick={() => setSelectedSlot(slot)}
                                style={{
                                  padding: '0.5rem',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '4px',
                                  background: selectedSlot === slot ? 'var(--primary)' : 'white',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="no-agents-error">No hay horas disponibles para este agente en la fecha seleccionada.</p>
                        )}
                      </>
                    )}
                  </div>
                  <p style={{ textAlign: 'center', color: '#666', margin: '2rem 0' }}>
                    Selecciona un agente y una hora para continuar.
                  </p>

                <div className="reservation-actions">
                  <button 
                    className="btn-cancel" 
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                  >
                    Cerrar
                  </button>
                  <button 
                    className="btn-confirm" 
                    onClick={handleConfirmBooking}
                    disabled={!selectedSlot || isSubmitting}
                  >
                    {isSubmitting ? 'Reservando...' : 'Confirmar Reserva'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        .slot-btn:hover {
          border-color: var(--primary);
          background-color: var(--bg-light);
        }
        .slot-btn.selected {
          border-color: var(--primary);
          font-weight: bold;
        }
        .fc-day-past {
          background-color: #f8fafc;
          cursor: not-allowed !important;
        }
        .fc-day-today {
          background-color: #fef3c7 !important;
        }
      `}</style>
    </MainLayout>
  )
}

export default ClientBookingPage
