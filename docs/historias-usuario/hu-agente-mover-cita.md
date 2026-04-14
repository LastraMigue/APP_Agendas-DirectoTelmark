# HU-003: Agente mover cita

## Como agente, quiero poder mover citas arrastrándolas en el calendario

### Criterios de Aceptación

**Dado** que tengo una cita creada  
**Cuando** arrastro la cita a otro horario

**Entonces** se actualiza el horario de la cita  
**Y** se envía notificación de cambio (futuro)

### Requisitos Técnicos
- Implementar drag & drop
- Validar nuevo horario
- Persistir cambios en base de datos
- Actualizar en tiempo real
