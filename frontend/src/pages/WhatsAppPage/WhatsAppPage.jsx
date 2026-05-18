import { MainLayout } from '../../layouts/MainLayout';
import WhatsAppManager from '../../components/WhatsAppManager/WhatsAppManager';
import { MessageSquare } from 'lucide-react';
import './WhatsAppPage.css';

const WhatsAppPage = () => {
  return (
    <MainLayout>
      <div className="whatsapp-page-container">
        <header className="whatsapp-page-header">
          <h1>
            <MessageSquare size={28} className="header-icon" /> Configuración de WhatsApp
          </h1>
          <p>
            Conecta la cuenta de WhatsApp de la empresa para enviar recordatorios automáticos a los clientes.
          </p>
        </header>

        <WhatsAppManager />
      </div>
    </MainLayout>
  );
};

export default WhatsAppPage;
