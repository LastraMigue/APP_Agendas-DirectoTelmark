import React, { useState, useEffect, useContext } from 'react'
import { MainLayout } from '../../layouts/MainLayout'
import AnalyticsDashboard from '../../components/Analytics/AnalyticsDashboard'
import { BarChart3 } from 'lucide-react'
import { AuthContext } from '../../context/AuthContext'
import { profilesService } from '../../services/supabase/profiles.service'
import './AnalyticsPage.css'

const AnalyticsPage = () => {
  const { user } = useContext(AuthContext)
  const [agents, setAgents] = useState([])
  const [selectedAgentId, setSelectedAgentId] = useState('all')
  const [loading, setLoading] = useState(true)

  const userRole = user?.user_metadata?.role || (user?.email === 'admin@test.com' ? 'admin' : '')
  const isAdminOrSupervisor = userRole === 'admin' || userRole === 'supervisor' || user?.email === 'admin@test.com'

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true)
        const fetchedStaff = await profilesService.getStaff()
        setAgents(fetchedStaff || [])

        if (!isAdminOrSupervisor && user) {
          const matchingAgent = fetchedStaff.find(a => a.id === user.id || a.email?.toLowerCase() === user.email?.toLowerCase())
          if (matchingAgent) {
            setSelectedAgentId(matchingAgent.id)
          } else {
            setSelectedAgentId(user.id || 'all')
          }
        } else {
          setSelectedAgentId('all')
        }
      } catch (err) {
        console.error('Error fetching staff for analytics:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAgents()
  }, [user, userRole, isAdminOrSupervisor])

  return (
    <MainLayout>
      <div className="analytics-page-container">
        <header className="analytics-header">
          <h2>Dashboard de Analíticas</h2>
          <p className="analytics-subtitle">Análisis detallado de rendimiento, conversión y métricas en tiempo real.</p>
        </header>

        {isAdminOrSupervisor && !loading && (
          <div className="agent-selector-container">
            <label htmlFor="metrics-agent-select"><strong>Filtrar por Agente:</strong></label>
            <select
              id="metrics-agent-select"
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="agent-select"
            >
              <option value="all">Todos los Agentes</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.full_name || agent.name || agent.email} {agent.id === user?.id ? '(Tú)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="analytics-card">
          <div className="card-header-inner">
            <h3><BarChart3 size={20} className="agent-icon" color="var(--primary)" /> Métricas de Rendimiento</h3>
          </div>
          <div className="card-divider"></div>
          <div className="analytics-body">
            {!loading && <AnalyticsDashboard selectedAgentId={selectedAgentId} />}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default AnalyticsPage
