import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import LoginPage from '../pages/auth/LoginPage'
import Dashboard from '../pages/Dashboard'
import NotFoundPage from '../pages/NotFoundPage'
import Loader from '../components/common/Loader/Loader'
import CalendarPage from '../pages/calendar/CalendarPage'

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
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default PrivateRoutes
