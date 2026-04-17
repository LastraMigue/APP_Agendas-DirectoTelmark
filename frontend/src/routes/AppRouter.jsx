import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import PrivateRoutes from './PrivateRoutes'
import LoginPage from '../pages/auth/LoginPage'
import ClientLoginPage from '../pages/auth/Clientloginform'

const AppRouter = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ClientLoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard/*" element={<PrivateRoutes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default AppRouter
