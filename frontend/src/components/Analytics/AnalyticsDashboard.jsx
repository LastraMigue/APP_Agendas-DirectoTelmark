import React, { useState, useEffect, useContext } from 'react'
import { CalendarDays, TrendingUp, UserCheck, BellRing, User } from 'lucide-react'
import { appointmentsService } from '../../services/supabase/appointments.service'
import { profilesService } from '../../services/supabase/profiles.service'
import { AuthContext } from '../../context/AuthContext'
import { format, parseISO } from 'date-fns'
import DailyActivityChart from './DailyActivityChart'
import ClientDistributionChart from './ClientDistributionChart'
import ConversionChart from './ConversionChart'
import StatCard from './StatCard'
import './Analytics.css'

const AnalyticsDashboard = ({ selectedAgentId = 'all' }) => {
  const { user } = useContext(AuthContext)
  const [agents, setAgents] = useState([])
  const [clients, setClients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [processedData, setProcessedData] = useState(null)
  const [loading, setLoading] = useState(true)

  const userRole = user?.user_metadata?.role || (user?.email === 'admin@test.com' ? 'admin' : '')
  const isAdminOrSupervisor = userRole === 'admin' || userRole === 'supervisor' || user?.email === 'admin@test.com'

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [fetchedStaff, fetchedClients, fetchedAppointments] = await Promise.all([
          profilesService.getStaff(),
          profilesService.getClients(),
          appointmentsService.getAll()
        ])
        
        setAgents(fetchedStaff || [])
        setClients(fetchedClients || [])
        setAppointments(fetchedAppointments || [])
      } catch (error) {
        console.error("Error al cargar datos de analíticas:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user, userRole, isAdminOrSupervisor])

  useEffect(() => {
    if (appointments.length > 0) {
      const result = processMetrics(appointments, selectedAgentId)
      setProcessedData(result)
    } else {
      setProcessedData(getEmptyData())
    }
  }, [selectedAgentId, appointments, clients])

  const getEmptyData = () => {
    return {
      kpis: {
        totalCitas: 0,
        reprogramadas: 0,
        conversionRate: '0.0',
        cancellationRate: '0.0',
        completadas: 0,
        canceladas: 0
      },
      dailyActivity: [],
      clientData: [],
      conversionData: [
        { name: 'Completadas', value: 0 },
        { name: 'Canceladas', value: 0 },
        { name: 'Pendientes', value: 0 }
      ]
    }
  }

  const processMetrics = (citas, agentId) => {
    // 1. Filtrar por agente
    const filtered = agentId === 'all' 
      ? citas 
      : citas.filter(c => c.agent_id === agentId)

    const totalCitas = filtered.length
    const now = new Date()

    // Citas canceladas (las que tienen "[Cancelada]" en la descripción)
    const canceladas = filtered.filter(c => c.description && c.description.includes('[Cancelada]')).length

    // Citas completadas (pasadas que no estén canceladas)
    const completadas = filtered.filter(c => c.end_time && new Date(c.end_time) < now && (!c.description || !c.description.includes('[Cancelada]'))).length

    // Citas pendientes (futuras que no estén canceladas)
    const pendientes = filtered.filter(c => c.start_time && new Date(c.start_time) >= now && (!c.description || !c.description.includes('[Cancelada]'))).length

    // Citas reprogramadas (las que tienen "[Reprogramada]" en la descripción)
    const reprogramadas = filtered.filter(c => c.description && c.description.includes('[Reprogramada]')).length

    // 2. Actividad diaria
    const dailyActivityMap = filtered.reduce((acc, cita) => {
      const dateString = cita.start_time || cita.fecha || cita.date
      if (!dateString) return acc
      try {
        const day = format(parseISO(dateString), 'MMM dd')
        acc[day] = (acc[day] || 0) + 1
      } catch (e) {
        console.error('Error parsing date:', dateString, e)
      }
      return acc
    }, {})

    // Ordenar fechas cronológicamente
    const dailyActivity = Object.entries(dailyActivityMap)
      .map(([date, count]) => ({ date, citas: count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))

    // 3. Tasas
    const conversionRate = totalCitas > 0 ? (completadas / totalCitas) * 100 : 0
    const cancellationRate = totalCitas > 0 ? (canceladas / totalCitas) * 100 : 0

    // 4. Clientes más frecuentes
    const clientMap = filtered.reduce((acc, app) => {
      let clientName = 'Desconocido'
      if (app.client_id) {
        const clientProf = clients.find(p => p.id === app.client_id)
        if (clientProf) {
          clientName = clientProf.full_name || clientProf.email
        }
      }
      if (clientName === 'Desconocido' && app.title) {
        clientName = app.title.replace(/^Cita:\s*/i, '').trim()
      }
      acc[clientName] = (acc[clientName] || 0) + 1
      return acc
    }, {})

    const clientData = Object.entries(clientMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    return {
      kpis: {
        totalCitas,
        reprogramadas,
        completadas,
        canceladas,
        conversionRate: conversionRate.toFixed(1),
        cancellationRate: cancellationRate.toFixed(1)
      },
      dailyActivity,
      clientData,
      conversionData: [
        { name: 'Completadas', value: completadas },
        { name: 'Canceladas', value: canceladas },
        { name: 'Pendientes', value: pendientes }
      ]
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-12 h-12 border-4 border-yellow-400 border-t-yellow-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  const data = processedData || getEmptyData()

  return (
    <div className="analytics-dashboard-container">
      {/* Charts Grid */}
      <div className="charts-grid-container">
        <div className="charts-grid-full-width">
          <DailyActivityChart data={data.dailyActivity} />
        </div>
        <ConversionChart data={data.conversionData} />
        <ClientDistributionChart data={data.clientData} />
      </div>
    </div>
  )
}

export default AnalyticsDashboard
