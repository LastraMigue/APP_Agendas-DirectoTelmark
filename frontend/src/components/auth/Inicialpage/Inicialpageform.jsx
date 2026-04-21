import { useNavigate } from 'react-router-dom';
import { User, Briefcase } from 'lucide-react';
import './InicialpageForm.css';

const Inicialpageform = () => {
  const navigate = useNavigate();

  return (
    <div className="inicial-buttons">
      <button 
        className="inicial-button cliente-button"
        onClick={() => navigate('/seleccionar')}
      >
        <User size={32} />
        <span className="inicial-button-text">Soy Cliente</span>
        <span className="inicial-button-description">Gestiona tus citas</span>
      </button>

      <button 
        className="inicial-button agente-button"
        onClick={() => navigate('/login')}
      >
        <Briefcase size={32} />
        <span className="inicial-button-text">Soy Agente</span>
        <span className="inicial-button-description">Accede al panel</span>
      </button>
    </div>
  );
};

export default Inicialpageform;