import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

const useAgents = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAgents must be used within AuthProvider')
  return context
}

export default useAgents
