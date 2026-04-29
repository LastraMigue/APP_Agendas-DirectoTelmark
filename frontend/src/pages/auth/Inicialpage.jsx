import { useState, useEffect } from 'react'
import Inicialpageform from '../../components/auth/Inicialpage'
import useAuth from '../../hooks/useAuth'

const Inicialpage = () => {
  const { isAuthenticated, signOut, loading } = useAuth()
  const [isFirstCheck, setIsFirstCheck] = useState(true)

  useEffect(() => {
    if (!loading && isAuthenticated && isFirstCheck) {
      signOut()
    }
    if (!loading) {
      setIsFirstCheck(false)
    }
  }, [loading, isAuthenticated, isFirstCheck, signOut])
  return (
    <div className="inicial-page">
      <div className="inicial-container">
        <div className="inicial-header">
          <img
            src="https://directotelmark.es/wp-content/uploads/2025/02/directotelmarksinfondo.png"
            alt="Directo Telmark"
            className="inicial-logo"
          />
          <h1 className="inicial-title">Agenda de Citas</h1>
          <p className="inicial-subtitle">Bienvenido al sistema de gestión de citas</p>
        </div>

        <Inicialpageform />

        <div className="inicial-footer">
          <p className="copyright">© 2026 Directo Telmark. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default Inicialpage;
