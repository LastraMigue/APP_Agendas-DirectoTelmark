import React, { useState } from 'react';
import './TakeAppointmentPage.css';

const TakeAppointmentPage = () => {
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    date: '',
    time: '',
    notes: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Cita registrada (Simulación):', formData);
    alert('Cita registrada exitosamente (Simulación)');
    setFormData({
      clientName: '',
      clientPhone: '',
      date: '',
      time: '',
      notes: ''
    });
  };

  return (
    <div className="take-appointment-container">
      <h2>Coger Cita para Cliente</h2>
      <form onSubmit={handleSubmit} className="appointment-form">
        <div className="form-group">
          <label>Nombre del Cliente:</label>
          <input
            type="text"
            name="clientName"
            value={formData.clientName}
            onChange={handleChange}
            placeholder="Ej: Juan Pérez"
            required
          />
        </div>
        <div className="form-group">
          <label>Teléfono:</label>
          <input
            type="tel"
            name="clientPhone"
            value={formData.clientPhone}
            onChange={handleChange}
            placeholder="Ej: +34 600 000 000"
            required
          />
        </div>
        <div className="form-group">
          <label>Fecha:</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Hora:</label>
          <input
            type="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Notas adicionales:</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="4"
            placeholder="Detalles adicionales sobre la cita..."
          ></textarea>
        </div>
        <button type="submit" className="submit-btn">Registrar Cita</button>
      </form>
    </div>
  );
};

export default TakeAppointmentPage;
