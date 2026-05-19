import { useState, useEffect, useContext, useCallback } from 'react'
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
import { canManageAppointments } from '../../utils/roleUtils'
import { ROLES } from '../../utils/constants'
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
  const [reschedulingAppointment, setReschedulingAppointment] = useState(null)
  const [pendingAction, setPendingAction] = useState(null)
  const [toast, setToast] = useState(null) // { message, type: 'error'|'success' }

  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const START_HOUR = 8
  const END_HOUR = 18

  const userRole = user?.user_metadata?.role || (user?.email === 'admin@test.com' ? ROLES.ADMIN : '')
  const isAdmin = userRole === ROLES.ADMIN || user?.email === 'admin@test.com'
  const isSupervisor = userRole === ROLES.SUPERVISOR
  const canManage = canManageAppointments(userRole)
  const userEmail = user?.email?.toLowerCase()

  const getAvailableHours = (date, excludeAppId = null) => {
    const hours = []
    for (let h = START_HOUR; h < END_HOUR; h++) {
      // Creamos el intervalo del hueco (1 hora: h:00 a (h+1):00)
      const slotStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, 0, 0)
      const slotEnd = new Date(slotStart.getTime() + 60 * 60000)
      
      // VALIDACIÓN: No permitir horas que ya han pasado hoy
      const now = new Date()
      if (date.toDateString() === now.toDateString() && slotEnd <= now) {
        continue
      }
      
      const isOccupied = appointments.some(app => {
        if (excludeAppId && app.id === excludeAppId) return false
        const isCancelled = app.description && app.description.includes('[Cancelada]')
        if (isCancelled) return false
        
        const appStart = new Date(app.start_time || app.start)
        const appEnd = new Date(app.end_time || app.end || new Date(appStart.getTime() + 60 * 60000))
        
        // Solapamiento: (HuecoInicio < CitaFin) Y (HuecoFin > CitaInicio)
        return (slotStart < appEnd) && (slotEnd > appStart)
      })
      
      if (!isOccupied) {
        hours.push({
          value: h,
          label: `${h.toString().padStart(2, '0')}:00 - ${(h + 1).toString().padStart(2, '0')}:00`
        })
      }
    }
    return hours
  }

  const [activeAgentId, setActiveAgentId] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (agents.length > 0) {
      setAvailableAgents(agents)
      
      // Inicializar activeAgentId al usuario actual si existe en la lista de personal
      if (!activeAgentId) {
        const currentUserProfile = agents.find(a => a.id === user?.id)
        if (currentUserProfile) {
          setActiveAgentId(currentUserProfile.id)
        } else {
          setActiveAgentId(agents[0].id)
        }
      }

      if (!selectedAgentId) {
        setSelectedAgentId(agents[0].id)
      }
    }
  }, [agents, user])

  useEffect(() => {
    if (isModalOpen && selectedDate) {
      const hours = getAvailableHours(selectedDate, reschedulingAppointment?.id)
      setAvailableHours(hours)
    }
  }, [isModalOpen, selectedDate, selectedAgentId, appointments, reschedulingAppointment])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [fetchedStaff, fetchedAppointments] = await Promise.all([
        profilesService.getStaff(),
        appointmentsService.getAll()
      ])
      
      setAgents(fetchedStaff || [])
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
    const newStart = new Date(event.start)
    const newEnd = event.end ? new Date(event.end) : new Date(newStart.getTime() + 60 * 60000)
    const dateStr = newStart.toISOString().split('T')[0]

    const clientId = event.extendedProps.client_id
    const rawClientName = event.title
    const clientName = rawClientName.replace(/^Cita:\s*/i, '').trim()

    // VALIDACIÓN: No permitir mover a fechas pasadas
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const targetDate = new Date(newStart)
    targetDate.setHours(0, 0, 0, 0)

    if (targetDate < today) {
      showToast('No se pueden reprogramar citas a fechas pasadas.')
      dropInfo.revert()
      return
    }

    // VALIDACIÓN: si el día destino ya tiene una cita de este cliente → revert sin modal
    const conflictingApp = appointments.find(app => {
      if (String(app.id) === String(event.id)) return false
      const isCancelled = app.description && app.description.includes('[Cancelada]')
      if (isCancelled) return false

      const isSameClientId = clientId && app.client_id === clientId
      const appClientName = (app.client_name || app.title || '').replace(/^Cita:\s*/i, '').trim()
      const isSameClientName = appClientName && appClientName.toLowerCase() === clientName.toLowerCase()
      if (!(isSameClientId || isSameClientName)) return false

      const appDate = new Date(app.start_time || app.start).toISOString().split('T')[0]
      return appDate === dateStr
    })

    if (conflictingApp) {
      const conflictTime = new Date(conflictingApp.start_time || conflictingApp.start)
        .toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      showToast(`"${clientName}" ya tiene una cita este día a las ${conflictTime}. Un cliente no puede tener dos citas el mismo día.`)
      dropInfo.revert()
      return
    }

    // Si no hay conflicto, abrimos el modal para que el usuario elija la hora exacta en el nuevo día
    setReschedulingAppointment({
      id: event.id,
      agent_id: event.extendedProps.agent_id || selectedAgentId,
      client_id: clientId,
      title: event.title,
      client_name: clientName
    })
    
    setPendingAction(dropInfo)
    const newDateOnly = new Date(newStart)
    newDateOnly.setHours(0, 0, 0, 0)
    setSelectedDate(newDateOnly)
    setSelectedAgentId(event.extendedProps.agent_id || selectedAgentId)
    setSelectedHour(newStart.getHours().toString())
    setIsModalOpen(true)
  }

  const handleEventResize = async (resizeInfo) => {
    const { event } = resizeInfo
    
    const newDate = new Date(event.start)
    newDate.setHours(0, 0, 0, 0)
    
    setReschedulingAppointment({
      id: event.id,
      agent_id: event.extendedProps.agent_id || selectedAgentId,
      client_id: event.extendedProps.client_id,
      title: event.title,
      client_name: event.title
    })
    
    setPendingAction(resizeInfo)
    
    setSelectedDate(newDate)
    setSelectedAgentId(event.extendedProps.agent_id || selectedAgentId)
    setSelectedHour(new Date(event.start).getHours().toString())
    setIsModalOpen(true)
  }

  const handleEventClick = (clickInfo) => {
    const { event } = clickInfo
    
    const currentDate = new Date(event.start)
    currentDate.setHours(0, 0, 0, 0)
    
    setReschedulingAppointment({
      id: event.id,
      agent_id: event.extendedProps.agent_id || selectedAgentId,
      client_id: event.extendedProps.client_id,
      title: event.title,
      client_name: event.title
    })
    
    setSelectedDate(currentDate)
    setSelectedAgentId(event.extendedProps.agent_id || selectedAgentId)
    setSelectedHour(new Date(event.start).getHours().toString()) // Pre-seleccionamos la hora actual
    setIsModalOpen(true)
  }

  const getAgentEvents = (agentId) => {
    return appointments
      .filter(app => {
        const isCancelled = app.description && app.description.includes('[Cancelada]')
        return app.agent_id === agentId && !isCancelled
      })
      .map(app => ({
        id: app.id,
        title: app.client_name || app.title || 'Cita Programada',
        start: app.start_time || app.start,
        end: app.end_time || app.end,
        allDay: false,
        extendedProps: {
          client_id: app.client_id,
          agent_id: app.agent_id
        }
      }))
  }

  const handleDateSelect = (selectInfo) => {
    const { start } = selectInfo
    const targetDate = new Date(start)
    targetDate.setHours(0, 0, 0, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (targetDate < today) {
      showToast('No se pueden programar citas en fechas pasadas.')
      return
    }
    
    setSelectedDate(targetDate)
    setAvailableAgents(agents)
    setSelectedAgentId(agents.length > 0 ? agents[0].id : '')
    setIsModalOpen(true)
  }

  const handleAgentChange = (e) => {
    const newAgentId = e.target.value
    setSelectedAgentId(newAgentId)
    setSelectedHour('')
    if (selectedDate) {
      const hours = getAvailableHours(selectedDate, newAgentId, reschedulingAppointment?.id)
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

      // VALIDACIÓN: Un cliente no puede tener dos citas el mismo día (sin importar el agente)
      const clientId = reschedulingAppointment?.client_id
      const rawClientName = reschedulingAppointment?.client_name || reschedulingAppointment?.title || user.user_metadata?.full_name || user.email
      const clientName = rawClientName.replace(/^Cita:\s*/i, '').trim()
      // VALIDACIÓN: No permitir fechas pasadas
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        showToast('No se puede programar una cita en una fecha pasada.')
        setIsSubmitting(false)
        return
      }

      const dateStr = selectedDate.toISOString().split('T')[0]

      const conflictingApp = appointments.find(app => {
        // 1. Ignoramos la propia cita que estamos reprogramando
        if (reschedulingAppointment && String(app.id) === String(reschedulingAppointment.id)) return false

        // 2. Ignoramos citas canceladas
        const isCancelled = app.description && app.description.includes('[Cancelada]')
        if (isCancelled) return false

        // 3. Comprobamos si es el mismo cliente (por ID o por nombre)
        const isSameClientId = clientId && app.client_id === clientId
        const appClientName = (app.client_name || app.title || '').replace(/^Cita:\s*/i, '').trim()
        const isSameClientName = appClientName && appClientName.toLowerCase() === clientName.toLowerCase()

        if (!(isSameClientId || isSameClientName)) return false

        // 4. Comprobamos si es el mismo día
        const appDate = new Date(app.start_time || app.start).toISOString().split('T')[0]
        return appDate === dateStr
      })

      if (conflictingApp) {
        const conflictTime = new Date(conflictingApp.start_time || conflictingApp.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        showToast(`El cliente "${clientName}" ya tiene una cita este día a las ${conflictTime}. Un cliente no puede tener dos citas el mismo día.`)
        setIsSubmitting(false)
        return
      }

      // VALIDACIÓN: No solapar citas (Restricción Global de Intervalo)
      const isOverlapping = appointments.some(app => {
        // 1. Ignoramos la propia cita que estamos reprogramando
        if (reschedulingAppointment && String(app.id) === String(reschedulingAppointment.id)) return false

        // 2. Ignoramos citas canceladas
        const isCancelled = app.description && app.description.includes('[Cancelada]')
        if (isCancelled) return false

        const appStart = new Date(app.start_time || app.start)
        const appEnd = new Date(app.end_time || app.end || new Date(appStart.getTime() + 60 * 60000))

        // Nueva cita: de startDateTime a endDateTime (1 hora de duración)
        // Condición de solapamiento: (NuevoInicio < ViejoFin) Y (NuevoFin > ViejoInicio)
        return (startDateTime < appEnd) && (endDateTime > appStart)
      })

      if (isOverlapping) {
        showToast('Ya existe una cita programada en este intervalo de tiempo. Por favor, seleccione otro horario.')
        setIsSubmitting(false)
        return
      }

      if (reschedulingAppointment) {
        // REPROGRAMAR: actualizar la cita existente (no crear una nueva)
        const originalApp = appointments.find(app => app.id === reschedulingAppointment.id)
        const currentDesc = originalApp?.description || ''
        const updatedData = {
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          agent_id: selectedAgentId,
          description: currentDesc.includes('[Reprogramada]') ? currentDesc : (currentDesc ? `${currentDesc} [Reprogramada]` : '[Reprogramada]')
        }
        await appointmentsService.update(reschedulingAppointment.id, updatedData)
      }
      
      await fetchData()
      setIsModalOpen(false)
      setSelectedDate(null)
      setSelectedAgentId('')
      setSelectedHour('')
      setAvailableHours([])
      setReschedulingAppointment(null)
      setPendingAction(null)
    } catch (error) {
      console.error('Error saving appointment:', error)
      showToast('Error al guardar la cita. Por favor intente de nuevo.')
      if (pendingAction) pendingAction.revert()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    if (pendingAction) pendingAction.revert()
    setIsModalOpen(false)
    setSelectedDate(null)
    setSelectedAgentId('')
    setSelectedHour('')
    setAvailableHours([])
    setReschedulingAppointment(null)
    setPendingAction(null)
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
          <h2>{isAdmin || isSupervisor ? 'Agendas de Agentes' : 'Mi Calendario'}</h2>
          <p>{isAdmin || isSupervisor ? 'Visualiza y gestiona las citas de todos los agentes del sistema.' : 'Visualiza y gestiona tus citas programadas.'}</p>
        </header>

        {isAdmin && (
          <div className="agent-selector-container">
            <label htmlFor="active-agent-select"><strong>Seleccionar Agente: </strong></label>
            <select
              id="active-agent-select"
              value={activeAgentId}
              onChange={(e) => setActiveAgentId(e.target.value)}
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

        <Toast toast={toast} onClose={() => setToast(null)} />

        {agents.length === 0 && !(isAdmin || isSupervisor) ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
            <CalendarIcon size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>No hay agentes registrados en la base de datos.</p>
          </div>
        ) : (
          <div className="calendars-grid">

            {agents
              .filter(agent => {
                if (isAdmin) {
                  return agent.id === activeAgentId
                }
                if (isSupervisor) return true
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
                  editable={canManage}
                  droppable={canManage}
                  selectable={false}
                  eventClick={handleEventClick}
                  eventDrop={handleEventDrop}
                  eventResize={handleEventResize}
                  height="auto"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <ReservationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmReservation}
        rescheduling={reschedulingAppointment}
        selectedDate={selectedDate}
        selectedAgentId={selectedAgentId}
        availableAgents={availableAgents}
        availableHours={availableHours}
        selectedHour={selectedHour}
        setSelectedHour={setSelectedHour}
        handleAgentChange={handleAgentChange}
        isSubmitting={isSubmitting}
      />
    </MainLayout>
  )
}

// Toast de aviso en la app (reemplaza los alert() del navegador)
const Toast = ({ toast, onClose }) => {
  if (!toast) return null
  const isError = toast.type === 'error'
  return (
    <div style={{
      marginBottom: '1.5rem',
      width: '100%',
      backgroundColor: isError ? '#fef2f2' : '#f0fdf4',
      border: `1px solid ${isError ? '#fca5a5' : '#86efac'}`,
      borderLeft: `4px solid ${isError ? '#ef4444' : '#22c55e'}`,
      borderRadius: '8px',
      padding: '1rem 1.25rem',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      animation: 'slideInDown 0.3s ease',
    }}>
      <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{isError ? '⛔' : '✅'}</span>
      <p style={{ margin: 0, color: isError ? '#b91c1c' : '#15803d', fontSize: '1rem', fontWeight: '500', flex: 1 }}>
        {toast.message}
      </p>
      <button
        onClick={onClose}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: isError ? '#b91c1c' : '#15803d', fontSize: '1.2rem',
          flexShrink: 0, padding: '0 0.5rem', lineHeight: 1
        }}
        aria-label="Cerrar aviso"
      >×</button>
    </div>
  )
}


const ReservationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  rescheduling, 
  selectedDate, 
  selectedAgentId, 
  availableAgents, 
  availableHours, 
  selectedHour, 
  setSelectedHour, 
  handleAgentChange, 
  isSubmitting 
}) => {
  if (!isOpen) return null;

  return (
    <div className="reservation-modal-overlay">
      <div className="reservation-modal">
        <h3>Reprogramar Cita</h3>
        
        <div className="reservation-details">
          <p><strong>Día:</strong> {selectedDate?.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>Cliente:</strong> {rescheduling?.client_name}</p>
        </div>

        <div className="reservation-form">
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Seleccionar Agente:</label>
            <select 
              className="agent-select"
              value={selectedAgentId} 
              onChange={handleAgentChange}
              disabled={rescheduling}
            >
              <option value="">Seleccione un agente</option>
              {availableAgents.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.name || agent.full_name || agent.email}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Seleccionar Hora:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}>
              {availableHours.length > 0 ? (
                availableHours.map(hour => (
                  <button
                    key={hour.value}
                    type="button"
                    className={`hour-btn ${selectedHour === hour.value.toString() ? 'selected' : ''}`}
                    onClick={() => setSelectedHour(hour.value.toString())}
                    style={{
                      padding: '0.5rem',
                      border: '1px solid var(--primary)',
                      borderRadius: '4px',
                      background: selectedHour === hour.value.toString() ? 'var(--primary)' : 'white',
                      color: selectedHour === hour.value.toString() ? 'var(--text-main)' : 'var(--primary)',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    {hour.label}
                  </button>
                ))
              ) : (
                <p style={{ gridColumn: 'span 2', fontSize: '0.85rem', color: '#ef4444', textAlign: 'center' }}>No hay horas disponibles</p>
              )}
            </div>
          </div>
        </div>

        <div className="reservation-actions">
          <button 
            className="btn-cancel" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button 
            className="btn-confirm" 
            onClick={onConfirm}
            disabled={isSubmitting || !selectedHour || !selectedAgentId}
          >
            {isSubmitting ? 'Guardando...' : 'Reprogramar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage
