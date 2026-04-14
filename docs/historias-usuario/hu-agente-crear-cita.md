# HU-001: Agente crear cita

## Como agente, quiero poder crear citas con clientes para programar reuniones

### Criterios de Aceptación

**Dado** que estoy autenticado como agente  
**Cuando** lleno el formulario de nueva cita con:
- Cliente seleccionado
- Fecha y hora
- Tipo de cita
- Descripción opcional

**Entonces** se crea la cita y aparece en mi calendario

### Requisitos Técnicos
- Validación de campos obligatorios
- Verificar disponibilidad del agente
- Enviar notificación al cliente (futuro)
