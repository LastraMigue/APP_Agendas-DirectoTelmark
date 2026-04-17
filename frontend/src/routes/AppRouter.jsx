import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import PrivateRoutes from './PrivateRoutes'
import LoginPage from '../pages/auth/LoginPage'
import Inicialpage from '../pages/auth/Inicialpage'

const AppRouter = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/inicial" element={<Inicialpage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<PrivateRoutes />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default AppRouter
