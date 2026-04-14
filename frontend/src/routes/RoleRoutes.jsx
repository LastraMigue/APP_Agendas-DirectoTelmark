import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from '../components/auth/ProtectedRoute'

const RoleRoutes = ({ allowedRoles, children }) => {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <Routes>{children}</Routes>
    </ProtectedRoute>
  )
}

export default RoleRoutes
