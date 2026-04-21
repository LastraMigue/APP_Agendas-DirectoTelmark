import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import PrivateRoutes from './PrivateRoutes'
import LoginPage from '../pages/auth/LoginPage'
import ClientLoginPage from '../pages/auth/Clientloginform'
import ClientSelectionPage from '../pages/auth/ClientSelectionPage'
import ClientSignInPage from '../pages/auth/ClientSignInPage'
import Inicialpage from '../pages/auth/Inicialpage'

const AppRouter = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ClientSelectionPage />} />
          <Route path="/registrarse" element={<ClientLoginPage />} />
          <Route path="/iniciar-sesion" element={<ClientSignInPage />} />
          <Route path="/inicial" element={<Inicialpage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard/*" element={<PrivateRoutes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default AppRouter
