import { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { MessageSquare, RefreshCw, LogOut, CheckCircle, Info, Smartphone, Wifi, QrCode } from 'lucide-react';
import './WhatsAppManager.css';

const WhatsAppManager = () => {
  const [status, setStatus] = useState({ connected: false, qr: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const SERVICE_URL = import.meta.env.VITE_WHATSAPP_SERVICE_URL || 'http://localhost:3000';

  const fetchStatus = async () => {
    try {
      const response = await axios.get(`${SERVICE_URL}/whatsapp-status`);
      setStatus(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching WhatsApp status:', err);
      setError('No se pudo conectar con el microservicio de WhatsApp. Verifica que el servidor esté corriendo en ' + SERVICE_URL);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDisconnect = async () => {
    if (!window.confirm('¿Estás seguro de que deseas desvincular WhatsApp?')) return;
    
    setIsDisconnecting(true);
    try {
      await axios.post(`${SERVICE_URL}/whatsapp-logout`);
      alert('WhatsApp desvinculado correctamente. Se generará un nuevo QR.');
    } catch (err) {
      console.error('Error al desvincular:', err);
      alert('Error al intentar desvincular');
    } finally {
      setIsDisconnecting(false);
      fetchStatus();
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <RefreshCw className="spinner" size={48} />
        <p>Consultando estado del servicio...</p>
      </div>
    );
  }

  return (
    <div className="whatsapp-manager-container">
      <div className="whatsapp-card">
        {/* Cabecera */}
        <div className="whatsapp-card-header">
          <div className="header-left">
            <div className="header-icon-wrapper">
              <MessageSquare size={24} />
            </div>
            <div className="header-info">
              <h2>Gestión de WhatsApp</h2>
              <p>Notificaciones automáticas de citas</p>
            </div>
          </div>
          
          <div className="status-badge">
            <div className={`status-dot ${status.connected ? 'connected' : 'disconnected'}`} />
            <span>{status.connected ? 'Conectado' : 'Desconectado'}</span>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="whatsapp-card-body">
          {error && (
            <div className="error-banner">
              <Info size={20} />
              <div className="error-content">
                <h4>Error de conexión</h4>
                <p>{error}</p>
              </div>
            </div>
          )}

          {status.connected ? (
            <div className="connected-state">
              <div className="success-icon-wrapper">
                <div className="success-bg-blur" />
                <div className="success-icon-main">
                  <CheckCircle size={64} />
                </div>
              </div>
              
              <h3>Servicio Activo</h3>
              <p>
                El sistema de notificaciones está funcionando correctamente. Los clientes recibirán mensajes de confirmación automáticamente.
              </p>
              
              <button
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="btn-disconnect"
              >
                <LogOut size={20} />
                {isDisconnecting ? 'Desconectando...' : 'Desvincular Cuenta'}
              </button>
            </div>
          ) : (
            <div className="setup-grid">
              {/* Instrucciones */}
              <div className="setup-instructions">
                <h3>
                  <Smartphone size={24} className="icon-primary" />
                  Pasos para vincular
                </h3>
                
                <div className="steps-list">
                  <div className="step-item">
                    <div className="step-number">1</div>
                    <p className="step-text">Abre <strong>WhatsApp</strong> en tu teléfono móvil.</p>
                  </div>
                  <div className="step-item">
                    <div className="step-number">2</div>
                    <p className="step-text">Toca el icono de <strong>Menú</strong> o <strong>Configuración</strong> y selecciona <strong>Dispositivos vinculados</strong>.</p>
                  </div>
                  <div className="step-item">
                    <div className="step-number">3</div>
                    <p className="step-text">Toca en <strong>Vincular un dispositivo</strong> y apunta tu cámara hacia esta pantalla.</p>
                  </div>
                </div>

                <div className="setup-tip">
                  <Wifi size={20} />
                  <p>
                    Asegúrate de que tu teléfono tenga una conexión a internet activa para completar el proceso.
                  </p>
                </div>
              </div>

              {/* QR Code */}
              <div className="qr-section">
                <div className="qr-container">
                  {status.qr ? (
                    <QRCodeSVG 
                      value={status.qr} 
                      size={240} 
                      level="H"
                      includeMargin={true}
                    />
                  ) : (
                    <div className="qr-placeholder">
                      <RefreshCw className="spinner" size={40} />
                      <p>Generando QR...</p>
                    </div>
                  )}
                </div>
                <p className="qr-footer-text">Escanea el código QR</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Pie */}
        <div className="whatsapp-card-footer">
          <p className="footer-copy">
            DirectoTelmark &copy; 2024 - Sistema de Notificaciones v2.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppManager;
