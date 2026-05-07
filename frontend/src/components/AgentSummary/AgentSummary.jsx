import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import { appointmentsService } from '../../services/supabase/appointments.service';
import { profilesService } from '../../services/supabase/profiles.service';
import Loader from '../Loader/Loader';
import './AgentSummary.css';

const AgentSummary = ({ user }) => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const all = await appointmentsService.getAll();
        
        const userId = user?.id;
        const userEmail = user?.email?.toLowerCase();
        const userRole = user?.user_metadata?.role;
        const now = new Date();

        const filtered = all
          .filter(app => {
            const appStartTime = new Date(app.start_time || app.start);
            
            // 1. Solo mostrar citas que no han pasado (o están ocurriendo ahora)
            if (appStartTime < now) return false;

            // 2. Filtrar por el usuario actual (sea Agente o Admin)
            const appAgentEmail = app.agent_email?.toLowerCase();
            const appEmail = app.email?.toLowerCase();

            const matchesId = app.agent_id === userId;
            const matchesEmail = userEmail && (appAgentEmail === userEmail || appEmail === userEmail);
            
            return (matchesId || matchesEmail);
          })
          .sort((a, b) => new Date(a.start_time || a.start) - new Date(b.start_time || b.start))
          .slice(0, 3);
        
        setAppointments(filtered);
      } catch (error) {
        console.error('Error fetching summary:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchUpcoming();
  }, [user]);

  if (loading) return (
    <div className="agent-summary-card loading">
      <Loader text="Cargando agenda..." />
    </div>
  );
  
  if (appointments.length === 0) return (
    <div className="agent-summary-card empty">
      <div className="summary-header">
        <h3><Calendar size={20} /> Próximas Citas</h3>
      </div>
      <p className="empty-msg">
        {user?.user_metadata?.role === 'admin' 
          ? 'No hay citas programadas en el sistema próximamente.' 
          : 'No tienes citas programadas próximamente.'}
      </p>
    </div>
  );

  return (
    <div className="agent-summary-card">
      <div className="summary-header">
        <h3><Calendar size={20} /> Próximas Citas</h3>
        <button className="view-all-btn" onClick={() => navigate('/dashboard/appointments/history')}>
          Ver todas
        </button>
      </div>
      <div className="summary-list">
        {appointments.map(app => {
          const date = new Date(app.start_time);
          return (
            <div key={app.id} className="summary-item" onClick={() => navigate('/dashboard/appointments/history')}>
              <div className="item-time-box">
                <span className="time-text">{date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                <Clock size={14} className="time-icon" />
              </div>
              <div className="item-content">
                <span className="client-name">{app.title || 'Cita Programada'}</span>
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

export default AgentSummary;
