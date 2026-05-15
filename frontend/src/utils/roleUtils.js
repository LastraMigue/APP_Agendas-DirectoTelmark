import { ROLES } from './constants'

export const hasRole = (userRole, allowedRoles) => {
  return allowedRoles.includes(userRole)
}

export const canManageAgents = (role) => {
  const normalizedRole = role?.toLowerCase()
  return [ROLES.ADMIN, ROLES.SUPERVISOR].includes(normalizedRole)
}

export const canManageAppointments = (role) => {
  const normalizedRole = role?.toLowerCase()
  return [
    ROLES.ADMIN, 
    ROLES.SUPERVISOR, 
    ROLES.AGENT,
    'agente' // Spanish synonym used in some parts of the code
  ].includes(normalizedRole)
}
