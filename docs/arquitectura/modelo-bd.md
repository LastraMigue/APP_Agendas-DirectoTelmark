# Modelo de Base de Datos

## Tablas Principales

### users
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| email | TEXT | Unique |
| name | TEXT | Nombre |
| role | TEXT | admin/supervisor/agent |
| agent_id | UUID | FK a agents |

### agents
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| name | TEXT | Nombre |
| email | TEXT | Unique |
| phone | TEXT | Teléfono |
| specialty | TEXT | Especialidad |

### clients
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| name | TEXT | Nombre |
| email | TEXT | Email |
| phone | TEXT | Teléfono |
| address | TEXT | Dirección |

### appointments
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| client_id | UUID | FK |
| agent_id | UUID | FK |
| title | TEXT | Título |
| start_time | TIMESTAMP | Inicio |
| end_time | TIMESTAMP | Fin |
| status | TEXT | pending/confirmed/cancelled/completed |

### notifications
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK |
| title | TEXT | Título |
| read | BOOLEAN | Leída |
