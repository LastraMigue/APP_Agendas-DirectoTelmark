import { useNavigate } from 'react-router-dom';
import { User, Briefcase } from 'lucide-react';
import Button from '../../common/Button';

const Inicialpageform = () => {
  const navigate = useNavigate();

  return (
    <div className="inicial-form">
      <Button 
        type="button" 
        variant="primary" 
        size="large"
        className="inicial-btn cliente-btn"
        onClick={() => navigate('/login-cliente')}
      >
        <User className="btn-icon" />
        Soy Cliente
      </Button>

      <Button 
        type="button" 
        variant="secondary" 
        size="large"
        className="inicial-btn agente-btn"
        onClick={() => navigate('/login')}
      >
        <Briefcase className="btn-icon" />
        Soy Agente
      </Button>
    </div>
  );
};

export default Inicialpageform;
