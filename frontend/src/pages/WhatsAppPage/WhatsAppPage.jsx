import { MainLayout } from '../../layouts/MainLayout';
import WhatsAppManager from '../../components/WhatsAppManager/WhatsAppManager';
import { MessageSquare } from 'lucide-react';
import './WhatsAppPage.css';

const WhatsAppPage = () => {
  return (
    <MainLayout>
      <div className="main-content">
        <header className="whatsapp-page-header">
          <div className="whatsapp-page-title">
            <MessageSquare size={32} />
            <h1>Configuración de WhatsApp</h1>
          </div>
          <p className="whatsapp-page-desc">
            Conecta la cuenta de WhatsApp de la empresa para enviar recordatorios automáticos a los clientes.
          </p>
        </header>

        <WhatsAppManager />
      </div>
    </MainLayout>
  );
};

export default WhatsAppPage;
