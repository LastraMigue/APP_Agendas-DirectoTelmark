import React, { useState, useEffect } from 'react'
import { CalendarDays, TrendingUp, UserCheck, BellRing } from 'lucide-react'
import { analyticsService } from '../../services/supabase/analytics.service'
import DailyActivityChart from './DailyActivityChart'
import CreationSourceChart from './CreationSourceChart'
import ConversionChart from './ConversionChart'
import StatCard from './StatCard'
import './Analytics.css'

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const metrics = await analyticsService.getMetrics()
        setData(metrics)
      } catch (error) {
        console.error("Error al cargar métricas:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-400 border-t-blue-700 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!data) return <div className="p-8 text-center text-gray-500 font-medium">No hay datos disponibles</div>

  return (
    <div className="space-y-8 analytics-dashboard-container">
      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total de Citas" 
          value={data.kpis.totalCitas} 
          icon={CalendarDays} 
        />
        <StatCard 
          title="Tasa de Conversión" 
          value={`${data.kpis.conversionRate}%`} 
          subtitle="Citas confirmadas vs total"
          icon={TrendingUp} 
        />
        <StatCard 
          title="Tasa de Cancelación" 
          value={`${data.kpis.cancellationRate}%`} 
          icon={UserCheck} 
        />
        <StatCard 
          title="Efec. Recordatorios" 
          value={`${data.kpis.reminderEffectiveness}%`} 
          subtitle="Completadas tras aviso"
          icon={BellRing} 
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="lg:col-span-2">
          <DailyActivityChart data={data.dailyActivity} />
        </div>
        <ConversionChart data={data.conversionData} />
        <CreationSourceChart data={data.creationSource} />
      </div>
    </div>
  )
}

export default AnalyticsDashboard
