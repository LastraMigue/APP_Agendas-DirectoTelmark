# Flujo de Autenticación

## Proceso de Login

1. Usuario ingresa email y contraseña
2. Supabase Auth valida credenciales
3. Se crea sesión con JWT
4. AuthContext actualiza estado del usuario
5. ProtectedRoute permite/rechaza acceso

## Roles y Permisos

| Recurso | Admin | Supervisor | Agent |
|---------|-------|------------|-------|
| Usuarios | CRUD | Read | - |
| Agentes | CRUD | CRUD | Read |
| Clientes | CRUD | CRUD | CRUD Propios |
| Citas | CRUD | CRUD | CRUD Propias |
