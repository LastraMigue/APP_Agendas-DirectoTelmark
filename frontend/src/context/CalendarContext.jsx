import { createContext, useState } from 'react'

export const CalendarContext = createContext()

export const CalendarProvider = ({ children }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState('week')

  return (
    <CalendarContext.Provider value={{ currentDate, setCurrentDate, view, setView }}>
      {children}
    </CalendarContext.Provider>
  )
}
