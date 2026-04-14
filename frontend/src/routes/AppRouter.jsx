import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PrivateRoutes from './PrivateRoutes'

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<PrivateRoutes />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
