import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

const useClients = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useClients must be used within AuthProvider')
  return context
}

export default useClients
