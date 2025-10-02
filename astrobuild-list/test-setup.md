# 🧪 Guía de Pruebas - AstroBuild List

## ✅ Lista de Verificación para Testing

### Configuración Inicial

#### 1. Dependencias del Sistema
- [ ] Node.js 18+ instalado
- [ ] PostgreSQL 12+ instalado y ejecutándose
- [ ] npm o yarn disponible

#### 2. Setup de Base de Datos
```bash
# Crear base de datos
createdb astrobuild_list

# O si usas psql:
psql -U postgres
CREATE DATABASE astrobuild_list;
\q
```

#### 3. Configuración Backend
```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus configuraciones de DB
npm run init-db
```

#### 4. Configuración Frontend
```bash
cd frontend
npm install
```

### Tests de Funcionalidad

#### Backend API Tests

##### Autenticación
- [ ] POST `/api/auth/login` con credenciales válidas
- [ ] POST `/api/auth/login` con credenciales inválidas
- [ ] POST `/api/auth/register` con datos válidos
- [ ] POST `/api/auth/register` con email duplicado

##### CRUD Carros
- [ ] GET `/api/cars` - Listar carros
- [ ] POST `/api/cars` - Crear carro nuevo
- [ ] PUT `/api/cars/:id` - Actualizar carro
- [ ] DELETE `/api/cars/:id` - Eliminar carro

##### CRUD Tareas
- [ ] GET `/api/tasks` - Listar tareas
- [ ] POST `/api/tasks` - Crear tarea nueva
- [ ] PUT `/api/tasks/:id` - Actualizar tarea
- [ ] PUT `/api/tasks/:id` con status='completed' - Verificar puntos

##### Leaderboard
- [ ] GET `/api/users/leaderboard` - Ranking de mecánicos
- [ ] GET `/api/users/stats` - Estadísticas generales

#### Frontend Tests

##### Autenticación
- [ ] Login con credenciales válidas
- [ ] Login con credenciales inválidas
- [ ] Registro de nuevo usuario
- [ ] Logout funcionando

##### Dashboard
- [ ] Estadísticas mostrándose correctamente
- [ ] Navegación entre tabs funcionando

##### Gestión de Carros
- [ ] Listar carros existentes
- [ ] Agregar nuevo carro
- [ ] Editar carro existente
- [ ] Eliminar carro
- [ ] Filtros funcionando

##### Gestión de Tareas
- [ ] Listar tareas existentes
- [ ] Agregar nueva tarea
- [ ] Editar tarea existente
- [ ] Marcar tarea como completada
- [ ] Verificar que los puntos se actualicen
- [ ] Filtros funcionando

##### Leaderboard
- [ ] Ranking mostrándose correctamente
- [ ] Posición personal visible
- [ ] Estadísticas de puntos correctas

#### Tiempo Real (Socket.io)
- [ ] Abrir dos ventanas del navegador
- [ ] Crear carro en una ventana, verificar que aparezca en la otra
- [ ] Crear tarea en una ventana, verificar que aparezca en la otra
- [ ] Completar tarea, verificar actualización de puntos en tiempo real

### Tests de Casos Extremos

#### Validaciones
- [ ] Crear carro sin campos requeridos
- [ ] Crear tarea con dificultad inválida
- [ ] Asignar tarea a mecánico inexistente
- [ ] Eliminar carro que tiene tareas asociadas

#### Performance
- [ ] Cargar página con muchos carros (50+)
- [ ] Cargar página con muchas tareas (100+)
- [ ] Verificar tiempo de respuesta de API

### Datos de Prueba

#### Usuarios Predefinidos
```
Email: juan@astrobuild.com
Email: maria@astrobuild.com
Email: carlos@astrobuild.com
Contraseña: password123
```

#### Carros de Prueba
```
1. Toyota Corolla 2020 - ABC-123 - Juan Pérez
2. Honda Civic 2019 - DEF-456 - María González
3. Ford Focus 2021 - GHI-789 - Carlos Ruiz
```

#### Tareas de Prueba
```
1. Cambio de aceite - Dificultad 1 (10 pts)
2. Reparación de frenos - Dificultad 3 (50 pts)
3. Cambio de transmisión - Dificultad 5 (200 pts)
```

### Comandos de Testing

#### Iniciar Desarrollo
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

#### Verificar Health
```bash
# Backend health check
curl http://localhost:3001/api/health

# Debería retornar: {"status":"OK","message":"AstroBuild List API is running!"}
```

#### Reset Database
```bash
cd backend
psql -U postgres -c "DROP DATABASE IF EXISTS astrobuild_list;"
createdb astrobuild_list
npm run init-db
```

### Checklist de Completación

#### ✅ Funcionalidades Core
- [ ] Autenticación completa
- [ ] CRUD Carros funcionando
- [ ] CRUD Tareas funcionando
- [ ] Sistema de puntos automático
- [ ] Leaderboard actualizado
- [ ] Tiempo real funcionando

#### ✅ UX/UI
- [ ] Diseño responsive
- [ ] Navegación intuitiva
- [ ] Mensajes de error claros
- [ ] Loading states
- [ ] Confirmaciones de eliminación

#### ✅ Performance
- [ ] Carga rápida inicial
- [ ] Filtros sin lag
- [ ] Tiempo real sin retrasos
- [ ] No memory leaks

#### ✅ Seguridad
- [ ] Tokens JWT funcionando
- [ ] Rutas protegidas
- [ ] Validaciones server-side
- [ ] No exposición de datos sensibles

### 🐛 Problemas Comunes

#### "Cannot connect to database"
- Verificar que PostgreSQL esté ejecutándose
- Revisar credenciales en .env
- Verificar que la base de datos existe

#### "CORS error"
- Verificar FRONTEND_URL en backend/.env
- Revisar configuración de CORS en server.js

#### "Socket.io not connecting"
- Verificar que ambos servidores estén corriendo
- Revisar URL en socket.ts

#### "Tasks not updating points"
- Verificar triggers en base de datos
- Revisar logs del backend
- Confirmar que completed_by se está estableciendo

---

¡Happy Testing! 🚀