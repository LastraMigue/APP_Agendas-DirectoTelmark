import { useNavigate } from 'react-router-dom'
import { 
  Calendar, 
  Users, 
  UserPlus, 
  BarChart3, 
  Settings, 
  Clock, 
  MessageSquare,
  ClipboardList,
  CalendarPlus
} from 'lucide-react'
import './DashboardActions.css'

const DashboardActions = ({ userRole }) => {
  const navigate = useNavigate()

  const getActionsByRole = () => {
    const commonActions = [
      { id: 'calendar', title: 'Calendarios Agentes', icon: <Calendar size={24} />, path: '/dashboard/calendar', desc: 'Gestiona citas de todos los agentes' },
    ]

    const adminActions = [
      { id: 'agents', title: 'Gestión de Agentes', icon: <Users size={24} />, path: '/admin/agents', desc: 'Administra el equipo y permisos' },
      { id: 'reports', title: 'Reportes y Métricas', icon: <BarChart3 size={24} />, path: '/dashboard/analytics', desc: 'Analiza el rendimiento global' },
      { id: 'settings', title: 'Configuración', icon: <Settings size={24} />, path: '/admin/settings', desc: 'Ajustes generales del sistema' },
    ]

    const agentActions = [
      { id: 'take-appointment', title: 'Coger Citas', icon: <CalendarPlus size={24} />, path: '/dashboard/appointments/take', desc: 'Reserva citas para clientes' },
      { id: 'new-client', title: 'Nuevo Cliente', icon: <UserPlus size={24} />, path: '/dashboard/clients/new', desc: 'Registra un cliente en el sistema' },
      { id: 'history', title: 'Historial de Citas', icon: <Clock size={24} />, path: '/dashboard/appointments/history', desc: 'Revisa gestiones registradas' },
      { id: 'whatsapp', title: 'Canal WhatsApp', icon: <MessageSquare size={24} />, path: '/dashboard/integration/whatsapp', desc: 'Envío de recordatorios' },
    ]

    const clientActions = [
      { id: 'my-appointments', title: 'Mis Citas', icon: <ClipboardList size={24} />, color: '#1a202c', path: '/dashboard/my-appointments', desc: 'Ver estado de mis reservas' },
      { id: 'book', title: 'Reservar Cita', icon: <Calendar size={24} />, color: '#1a202c', path: '/dashboard/book', desc: 'Solicita un nuevo hueco' },
    ]

    if (userRole === 'admin') return [...commonActions, ...adminActions]
    if (userRole === 'cliente' || userRole === 'client') return clientActions
    return [...commonActions, ...agentActions]
  }

  const actions = getActionsByRole()

  return (
    <div className="actions-grid">
      {actions.map((action) => (
        <div 
          key={action.id} 
          className="action-card" 
          onClick={() => navigate(action.path)}
        >
          <div className="card-icon">
            {action.icon}
          </div>
          <div className="card-content">
            <h3>{action.title}</h3>
            <p>{action.desc}</p>
          </div>
          <div className="card-arrow">→</div>
        </div>
      ))}
    </div>
  )
}

export default DashboardActions
