import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const RoleGuard = ({ allowedRoles, children }) => {
  const { user } = useAuth()
  
  if (!allowedRoles || allowedRoles.length === 0) {
    return children
  }

  const userRole = user?.user_metadata?.role
  
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default RoleGuard
