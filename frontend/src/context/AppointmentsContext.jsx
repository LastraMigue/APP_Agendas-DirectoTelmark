import { createContext, useState } from 'react'

export const AppointmentsContext = createContext()

export const AppointmentsProvider = ({ children }) => {
  const [appointments, setAppointments] = useState([])

  return (
    <AppointmentsContext.Provider value={{ appointments, setAppointments }}>
      {children}
    </AppointmentsContext.Provider>
  )
}
