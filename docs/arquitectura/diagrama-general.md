# Diagrama General de Arquitectura

## Visión General

La aplicación APP_Agendas-DirectoTelmark es una solución de gestión de agendas y citas construida con React + Vite en el frontend y Supabase como backend.

## Componentes Principales

- **Frontend**: React + Vite con React Router
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Estado**: Context API + Hooks personalizados
- **Estilos**: CSS modules o styled-components

## Flujo de Datos

```
User -> React Components -> Context/Hooks -> Supabase Services -> PostgreSQL
```

## Roles del Sistema

1. **Admin**: Acceso total
2. **Supervisor**: Gestión de agentes y reportes
3. **Agent**: Gestión de propias citas y clientes
