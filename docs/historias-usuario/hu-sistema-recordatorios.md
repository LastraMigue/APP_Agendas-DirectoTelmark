# HU-004: Sistema de recordatorios

## El sistema debe enviar recordatorios de citas próximas

### Criterios de Aceptación

**Dado** que existe una cita confirmada  
**Cuando** faltan 24 horas para la cita

**Entonces** se envía un recordatorio al agente  
**Y** se envía un recordatorio al cliente (si aplica)

### Requisitos Técnicos
- Función edge de Supabase para envío
- Programación de trabajos cron
- Plantillas de email/SMS
- Registro de notificaciones enviadas
