import { useContext } from 'react'
import { MainLayout } from '../layouts/MainLayout'
import { AuthContext } from '../context/AuthContext'
import DashboardActions from '../components/dashboard/DashboardActions'
import './Dashboard.css'

const Dashboard = () => {
  const { user } = useContext(AuthContext)
  
  // Lógica de detección de rol
  const userRole = user?.email === 'admin@test.com' ? 'admin' : (user?.user_metadata?.role || 'agente')
  const userName = user?.user_metadata?.full_name || user?.email

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
