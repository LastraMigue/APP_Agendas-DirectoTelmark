import React from 'react'
import AnalyticsDashboard from '../components/Analytics/AnalyticsDashboard'
import '../components/Analytics/Analytics.css'

const AnalyticsPage = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Dashboard de Analíticas</h1>
          <p className="dashboard-subtitle">Monitoriza el rendimiento, conversión y métricas de todas las citas en tiempo real.</p>
        </div>
        
        <AnalyticsDashboard />
      </div>
    </div>
  )
}

export default AnalyticsPage
