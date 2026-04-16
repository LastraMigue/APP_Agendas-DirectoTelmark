import './LoginPage.css'

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

        <form className="login-form">
          <div className="input-wrapper">
            <label className="input-label">Email</label>
            <input type="email" className="input-field" placeholder="tu@email.com" />
          </div>
          <div className="input-wrapper">
            <label className="input-label">Contraseña</label>
            <input type="password" className="input-field" placeholder="Tu contraseña" />
          </div>
          <button type="submit" className="btn btn-primary btn-large login-form-submit">
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
