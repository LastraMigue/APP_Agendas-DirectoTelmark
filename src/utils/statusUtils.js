import { APPOINTMENT_STATUS } from './constants'

export const getStatusColor = (status) => {
  const colors = {
    [APPOINTMENT_STATUS.PENDING]: 'yellow',
    [APPOINTMENT_STATUS.CONFIRMED]: 'green',
    [APPOINTMENT_STATUS.CANCELLED]: 'red',
    [APPOINTMENT_STATUS.COMPLETED]: 'blue'
  }
  return colors[status] || 'gray'
}

export const getStatusLabel = (status) => {
  const labels = {
    [APPOINTMENT_STATUS.PENDING]: 'Pendiente',
    [APPOINTMENT_STATUS.CONFIRMED]: 'Confirmada',
    [APPOINTMENT_STATUS.CANCELLED]: 'Cancelada',
    [APPOINTMENT_STATUS.COMPLETED]: 'Completada'
  }
  return labels[status] || status
}
