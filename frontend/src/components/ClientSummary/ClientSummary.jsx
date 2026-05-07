import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import { appointmentsService } from '../../services/supabase/appointments.service';
import { profilesService } from '../../services/supabase/profiles.service';
import Loader from '../Loader/Loader';
import '../AgentSummary/AgentSummary.css'; // Reutilizamos estilos base
import './ClientSummary.css';

const ClientSummary = ({ user }) => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const all = await appointmentsService.getAll();
        
        const userId = user?.id;
        const userEmail = user?.email?.toLowerCase();

        console.log('DEBUG - Tu Email:', userEmail);
        console.log('DEBUG - Tu ID:', userId);
        
        // Listamos todos los emails y IDs que hay en las citas para comparar
        const dbEmails = all.map(a => ({ 
          c_email: a.client_email, 
          a_email: a.agent_email, 
          email: a.email,
          c_id: a.client_id,
          a_id: a.agent_id
        }));
        console.log('DEBUG - Datos en DB:', dbEmails);

        const now = new Date();
        const filtered = all
          .filter(app => {
            const appStartTime = new Date(app.start_time || app.start);
            if (appStartTime < now) return false;

            const appClientEmail = app.client_email?.toLowerCase();
            const appAgentEmail = app.agent_email?.toLowerCase();
            const appEmail = app.email?.toLowerCase();

            const matchesId = app.client_id === userId || app.user_id === userId;
            const matchesEmail = userEmail && (appClientEmail === userEmail || appAgentEmail === userEmail || appEmail === userEmail);
            
            return (matchesId || matchesEmail);
          })
          .sort((a, b) => new Date(a.start_time || a.start) - new Date(b.start_time || b.start))
          .slice(0, 3);
        
        console.log('DEBUG - Citas filtradas:', filtered);
        setAppointments(filtered);
      } catch (error) {
        console.error('Error fetching client summary:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchUpcoming();
  }, [user]);

  if (loading) return (
    <div className="agent-summary-card loading">
      <Loader text="Cargando tus citas..." />
    </div>
  );
  
  if (appointments.length === 0) return (
    <div className="agent-summary-card empty">
      <div className="summary-header">
        <h3><Calendar size={20} /> Mis Próximas Citas</h3>
      </div>
      <p className="empty-msg">No tienes citas programadas próximamente.</p>
    </div>
  );

  return (
    <div className="agent-summary-card">
      <div className="summary-header">
        <h3><Calendar size={20} /> Mis Próximas Citas</h3>
        <button className="view-all-btn" onClick={() => navigate('/dashboard/appointments/my-appointments')}>
          Ver todas
        </button>
      </div>
      <div className="summary-list">
        {appointments.map(app => {
          const date = new Date(app.start_time);
          return (
            <div key={app.id} className="summary-item" onClick={() => navigate('/dashboard/appointments/my-appointments')}>
              <div className="item-time-box client">
                <span className="time-text">{date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                <Clock size={14} className="time-icon" />
              </div>
              <div className="item-content">
                <span className="client-name">{app.title || 'Cita Confirmada'}</span>
                <span className="item-date">{date.toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}</span>
              </div>
              <ChevronRight size={18} className="item-arrow" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClientSummary;
