import { useContext } from 'react'
import { CalendarContext } from '../context/CalendarContext'

const useCalendar = () => {
  const context = useContext(CalendarContext)
  if (!context) throw new Error('useCalendar must be used within CalendarProvider')
  return context
}

export default useCalendar
