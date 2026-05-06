import './Loader.css'

const Loader = ({ size = 'medium', text = 'Cargando...' }) => {
  return (
    <div className={`loader loader-${size}`}>
      <div className="loader-spinner" />
      {text && <span className="loader-text">{text}</span>}
    </div>
  )
}

export default Loader
