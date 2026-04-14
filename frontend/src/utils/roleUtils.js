import { ROLES } from './constants'

export const hasRole = (userRole, allowedRoles) => {
  return allowedRoles.includes(userRole)
}

export const canManageAgents = (role) => {
  return [ROLES.ADMIN, ROLES.SUPERVISOR].includes(role)
}

export const canManageAppointments = (role) => {
  return [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.AGENT].includes(role)
}
