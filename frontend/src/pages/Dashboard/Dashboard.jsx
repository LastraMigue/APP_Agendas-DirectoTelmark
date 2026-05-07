import { useContext, useState, useEffect } from 'react'
import { MainLayout } from '../../layouts/MainLayout'
import { AuthContext } from '../../context/AuthContext'
import DashboardActions from '../../components/DashboardActions'
import AgentSummary from '../../components/AgentSummary/AgentSummary'
import ClientSummary from '../../components/ClientSummary/ClientSummary'
import { supabase } from '../../services/supabase/client'
import './Dashboard.css'

const Dashboard = () => {
  const { user } = useContext(AuthContext)
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name || user?.email || '')
  
  // Lógica de detección de rol — prioriza user_metadata.role
  const userRole = user?.user_metadata?.role || (user?.email === 'admin@test.com' ? 'admin' : 'agente')

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return

      // Si ya tenemos el nombre en los metadatos, lo usamos
      if (user.user_metadata?.full_name) {
        setDisplayName(user.user_metadata.full_name)
        return
      }

      try {
        // Buscar en la tabla unificada de profiles
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .maybeSingle()
        
        if (error) throw error

        if (profile) {
          setDisplayName(profile.full_name)
          // Actualizar metadatos para persistir localmente
          await supabase.auth.updateUser({
            data: { full_name: profile.full_name, role: profile.role }
          })
        }
      } catch (error) {
        console.error('Error al recuperar datos del perfil:', error)
      }
    }

    fetchProfileData()
  }, [user])

  const userName = displayName

  return (
    <MainLayout>
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1>Panel de Control</h1>
          <p>
            Bienvenido de nuevo, <span className="highlight">{userName}</span>. ¿Qué quieres hacer hoy?
          </p>
        </header>

        {(userRole === 'agent' || userRole === 'agente') && user && (
          <AgentSummary user={user} />
        )}

        {(userRole === 'client' || userRole === 'cliente') && user && (
          <ClientSummary user={user} />
        )}

        <DashboardActions userRole={userRole} />
      </div>
    </MainLayout>
  )
}

export default Dashboard
