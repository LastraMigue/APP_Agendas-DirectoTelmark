import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import LoginPage from '../pages/LoginPage'
import Dashboard from '../pages/Dashboard'
import NotFoundPage from '../pages/NotFoundPage'
import Loader from '../components/Loader/Loader'
import TakeAppointmentPage from '../pages/TakeAppointmentPage'
import CalendarPage from '../pages/CalendarPage'
import ClientBookingPage from '../pages/ClientBookingPage'
import AgentAppointmentsPage from '../pages/AgentAppointmentsPage'
import ClientAppointmentsPage from '../pages/ClientAppointmentsPage'
import AnalyticsPage from '../pages/AnalyticsPage'

const PrivateRoutes = () => {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <Loader size="large" text="Cargando..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/book" element={<ClientBookingPage />} />
      <Route path="/appointments/take" element={<TakeAppointmentPage />} />
      <Route path="/appointments/history" element={<AgentAppointmentsPage />} />
      <Route path="/my-appointments" element={<ClientAppointmentsPage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default PrivateRoutes
