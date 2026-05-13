import React from 'react'
import { MainLayout } from '../../layouts/MainLayout'
import AnalyticsDashboard from '../../components/Analytics/AnalyticsDashboard'
import { BarChart3 } from 'lucide-react'
import './AnalyticsPage.css'

const AnalyticsPage = () => {
  return (
    <MainLayout>
      <div className="analytics-page-container">
        <header className="analytics-header">
          <div className="header-content">
            <div className="title-group">
              <BarChart3 className="header-icon" size={32} />
              <div>
                <h1 className="analytics-title">Dashboard de Analíticas</h1>
                <p className="analytics-subtitle">Análisis detallado de rendimiento, conversión y métricas en tiempo real</p>
              </div>
            </div>
          </div>
        </header>

        <div className="analytics-card">
          <div className="card-header-inner">
            <h3>Métricas de Rendimiento</h3>
          </div>
          <div className="analytics-body">
            <AnalyticsDashboard />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default AnalyticsPage
