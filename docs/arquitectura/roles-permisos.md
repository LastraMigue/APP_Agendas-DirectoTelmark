# Roles y Permisos

## Definición de Roles

### Admin
- Gestión completa de usuarios
- Gestión completa de agentes
- Gestión completa de clientes
- Gestión completa de citas
- Acceso a reportes
- Configuración del sistema

### Supervisor
- Gestión de agentes
- Gestión de clientes
- Gestión de citas del equipo
- Acceso a reportes del equipo
- Ver performance de agentes

### Agent
- Gestión de propias citas
- Gestión de propios clientes
- Ver calendario personal
- Recibir notificaciones

## Implementación

Los permisos se implementan mediante:
1. Row Level Security (RLS) en Supabase
2. ProtectedRoute en React
3. RoleGuard para componentes
4. Validación en servicios
