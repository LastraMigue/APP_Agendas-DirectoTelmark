import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase/client';
import { appointmentsService } from '../../services/supabase/appointments.service';
import { profilesService } from '../../services/supabase/profiles.service';
import { MainLayout } from '../../layouts/MainLayout';
import Loader from '../../components/Loader/Loader';
import { Calendar, Clock, User, Phone, Mail, FileText, AlertCircle, CheckCircle2, Users, RefreshCw } from 'lucide-react';
import './TakeAppointmentPage.css';

const TakeAppointmentPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    agentId: '',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    date: '',
    time: '',
    notes: ''
  });

  const fetchAgents = async () => {
    try {
      setLoadingAgents(true);
      setError(null);
      console.log('Cargando agentes desde profiles...');
      
      const agentsList = await profilesService.getAgents();
      setAgents(agentsList || []);
    } catch (err) {
      console.error('Error:', err);
      setError(`Error al cargar agentes: ${err.message}`);
    } finally {
      setLoadingAgents(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.agentId) {
      setError('Por favor, selecciona un agente.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Verificar que el cliente existe
      console.log('Verificando cliente con email:', formData.clientEmail);
      
      const clientProfile = await profilesService.getByEmail(formData.clientEmail);

      if (!clientProfile || clientProfile.role !== 'client') {
        throw new Error('El cliente no está registrado. Por favor, regístralo primero en el apartado de Gestión de Clientes.');
      }

      // 2. Crear Cita
      const startTime = new Date(`${formData.date}T${formData.time}`);
      const endTime = new Date(startTime.getTime() + 30 * 60000);

      await appointmentsService.create({
        agent_id: formData.agentId,
        client_id: clientProfile.id,
        title: `Cita: ${clientProfile.full_name}`,
        description: formData.notes,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'scheduled',
        priority: 'normal'
      });

      setSuccess(true);
      // Redirigir al dashboard tras 2 segundos para que el agente vea el éxito
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <MainLayout>
        <div className="take-appointment-success">
          <div className="success-card">
            <CheckCircle2 size={64} color="#10b981" />
            <h2>Cita Registrada</h2>
            <p>La cita para <strong>{formData.clientName}</strong> se ha guardado con éxito.</p>
            <p className="redirect-text">Redirigiendo...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="take-appointment-page">
        <div className="take-appointment-container">
          <header className="page-header">
            <h1>Nueva Cita para Cliente</h1>
            <p>Selecciona un agente y rellena los datos para programar la cita.</p>
          </header>

          {error && (
            <div className="error-message">
              <AlertCircle size={20} />
              <span>{error}</span>
              <button onClick={fetchAgents} className="retry-btn">
                <RefreshCw size={14} /> Reintentar
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="appointment-form">
            
            {/* SECCIÓN AGENTE */}
            <section className="form-section">
              <h3 className="section-title"><Users size={18} /> Agente Responsable</h3>
              <div className="form-group full-width">
                <div className="input-wrapper">
                  <Users className="input-icon" size={16} />
                  <select
                    name="agentId"
                    value={formData.agentId}
                    onChange={handleChange}
                    required
                    className="agent-select"
                    disabled={loadingAgents}
                  >
                    <option value="">
                      {loadingAgents ? 'Cargando agentes...' : '-- Selecciona un agente --'}
                    </option>
                    {agents.map(agent => (
                      <option key={agent.id} value={agent.id}>
                        {agent.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                {!loadingAgents && agents.length === 0 && !error && (
                  <p className="info-text">
                    <AlertCircle size={14} /> No se encontraron agentes en la base de datos.
                  </p>
                )}
              </div>
            </section>

            {/* SECCIÓN CLIENTE */}
            <section className="form-section">
              <h3 className="section-title"><User size={18} /> Información del Cliente</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre Completo</label>
                  <div className="input-wrapper">
                    <User className="input-icon" size={16} />
                    <input
                      type="text"
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleChange}
                      placeholder="Nombre del cliente"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <div className="input-wrapper">
                    <Phone className="input-icon" size={16} />
                    <input
                      type="tel"
                      name="clientPhone"
                      value={formData.clientPhone}
                      onChange={handleChange}
                      placeholder="Número de teléfono"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <div className="input-wrapper">
                    <Mail className="input-icon" size={16} />
                    <input
                      type="email"
                      name="clientEmail"
                      value={formData.clientEmail}
                      onChange={handleChange}
                      placeholder="correo@ejemplo.com"
                      required
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* SECCIÓN CITA */}
            <section className="form-section">
              <h3 className="section-title"><Calendar size={18} /> Fecha y Hora</h3>
              <div className="form-grid dual">
                <div className="form-group">
                  <label>Fecha</label>
                  <div className="input-wrapper">
                    <Calendar className="input-icon" size={16} />
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Hora</label>
                  <div className="input-wrapper">
                    <Clock className="input-icon" size={16} />
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </section>

            <div className="form-group full-width">
              <label><FileText size={16} /> Notas Adicionales</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Escribe aquí cualquier observación..."
              ></textarea>
            </div>

            <button type="submit" className="submit-btn" disabled={loading || loadingAgents || agents.length === 0}>
              {loading ? <Loader size="small" text="" /> : 'Confirmar y Guardar Cita'}
            </button>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default TakeAppointmentPage;
