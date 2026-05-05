import { useContext, useState, useEffect } from 'react'
import { MainLayout } from '../../layouts/MainLayout'
import { AuthContext } from '../../context/AuthContext'
import DashboardActions from '../../components/DashboardActions'
import { supabase } from '../../services/supabase/client'
import './Dashboard.css'

const Dashboard = () => {
  const { user } = useContext(AuthContext)
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name || user?.email || '')
  
  // Lógica de detección de rol — prioriza user_metadata.role
  const userRole = user?.user_metadata?.role || (user?.email === 'admin@test.com' ? 'admin' : 'agente')

  useEffect(() => {
    const fetchProfileData = async () => {
      if (user && !user.user_metadata?.full_name) {
        try {
          // Intentar buscar en clientes
          const { data: client } = await supabase
            .from('clients')
            .select('full_name')
            .eq('email', user.email)
            .maybeSingle()
          
          if (client) {
            setDisplayName(client.full_name)
            // Actualizar metadatos para la próxima vez
            await supabase.auth.updateUser({
              data: { full_name: client.full_name, role: 'cliente' }
            })
            return
          }

          // Si no es cliente, intentar buscar en perfiles (agentes/admin)
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, role')
            .eq('id', user.id)
            .maybeSingle()
          
          if (profile) {
            setDisplayName(profile.full_name)
            await supabase.auth.updateUser({
              data: { full_name: profile.full_name, role: profile.role }
            })
          }
        } catch (error) {
          console.error('Error al recuperar datos del perfil:', error)
        }
      } else if (user?.user_metadata?.full_name) {
        setDisplayName(user.user_metadata.full_name)
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

        <DashboardActions userRole={userRole} />
      </div>
    </MainLayout>
  )
}

export default Dashboard
