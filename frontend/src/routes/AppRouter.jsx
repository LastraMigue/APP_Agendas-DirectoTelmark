import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { NotificationProvider } from '../context/NotificationContext'
import PrivateRoutes from './PrivateRoutes'
import LoginPage from '../pages/LoginPage'
import ClientLoginPage from '../pages/Clientloginform'
import ClientSelectionPage from '../pages/ClientSelectionPage'
import ClientSignInPage from '../pages/ClientSignInPage'
import Inicialpage from '../pages/Inicialpage'

const AppRouter = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Inicialpage />} />
            <Route path="/registrarse" element={<ClientLoginPage />} />
            <Route path="/iniciar-sesion" element={<ClientSignInPage />} />
            <Route path="/seleccionar" element={<ClientSelectionPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard/*" element={<PrivateRoutes />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  )
}

export default AppRouter
