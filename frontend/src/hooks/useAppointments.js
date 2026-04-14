import { useContext } from 'react'
import { AppointmentsContext } from '../context/AppointmentsContext'

const useAppointments = () => {
  const context = useContext(AppointmentsContext)
  if (!context) throw new Error('useAppointments must be used within AppointmentsProvider')
  return context
}

export default useAppointments
