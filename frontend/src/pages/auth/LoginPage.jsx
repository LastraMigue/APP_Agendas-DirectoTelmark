import LoginForm from '../../components/auth/LoginForm'

const LoginPage = () => {
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <img 
            src="https://directotelmark.es/wp-content/uploads/2025/02/directotelmarksinfondo.png" 
            alt="Directo Telmark" 
            className="login-logo"
          />
          <h1 className="login-title">Agenda de Citas</h1>
          <p className="login-subtitle">Accede a tu cuenta para gestionar tus citas</p>
        </div>

        <LoginForm />
        
        <div className="login-footer">
          <p className="test-credentials">
            <strong>Credenciales de prueba:</strong><br />
            admin@test.com / password123
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage


