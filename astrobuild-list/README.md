# 🚗 AstroBuild List

Sistema de gestión de tareas para taller de reparación de autos con sistema de puntos y leaderboard en tiempo real.

## 🌟 Características

- **Gestión de Vehículos**: CRUD completo para carros con información del cliente
- **Gestión de Tareas**: Sistema de tareas con niveles de dificultad y asignación de mecánicos
- **Sistema de Puntos**: Puntuación automática basada en dificultad de tareas (10-200 puntos)
- **Leaderboard**: Ranking en tiempo real de mecánicos
- **Tiempo Real**: Actualizaciones instantáneas con Socket.io
- **Autenticación**: Sistema seguro con JWT
- **Responsive**: Interfaz adaptable a móviles y escritorio

## 🛠 Stack Tecnológico

### Backend
- **Node.js** con **Express.js**
- **PostgreSQL/Supabase** para base de datos (production-ready)
- **Socket.io** para actualizaciones en tiempo real
- **JWT** para autenticación
- **bcryptjs** para encriptación de contraseñas

### Frontend
- **Next.js 14** con **React 18**
- **TypeScript** para tipado estático
- **Tailwind CSS** para estilos
- **Lucide React** para iconos
- **Socket.io Client** para tiempo real

## 📋 Requisitos Previos

- Node.js 18+
- npm o yarn

*Backend migrado a PostgreSQL/Supabase - usar `astrobuild-backend-vercel` folder.*

## 🚀 Instalación

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd astrobuild-list
```

### 2. Configurar Backend (PostgreSQL/Supabase)

```bash
cd ../astrobuild-backend-vercel
npm install
```

Configura las variables de entorno:
```bash
# Crear archivo .env con tu conexión Supabase
echo "SUPABASE_DB_URL=tu_connection_string_aquí" > .env

# Ejecutar migraciones automáticas
npm run db:migrate
```

### 3. Configurar Frontend

```bash
cd ../frontend
npm install
```

## 🏃‍♂️ Ejecutar el Proyecto

### Desarrollo

Terminal 1 (Backend):
```bash
cd astrobuild-backend-vercel
npm start
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

La aplicación estará disponible en:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## 👥 Usuarios de Prueba

```
Email: juan@astrobuild.com
Email: maria@astrobuild.com
Email: carlos@astrobuild.com
Contraseña: password123 (para todos)
```

## 🎯 Sistema de Puntos

| Dificultad | Estrellas | Puntos |
|------------|-----------|--------|
| Fácil      | ⭐        | 10     |
| Medio      | ⭐⭐      | 25     |
| Difícil    | ⭐⭐⭐    | 50     |
| Muy Difícil| ⭐⭐⭐⭐  | 100    |
| Experto    | ⭐⭐⭐⭐⭐| 200    |

## 📱 Funcionalidades

### Gestión de Carros
- ✅ Agregar nuevos vehículos
- ✅ Editar información del vehículo
- ✅ Seguimiento de estado (Pendiente, En Progreso, Completado, Entregado)
- ✅ Información del cliente y contacto

### Gestión de Tareas
- ✅ Crear tareas con diferentes niveles de dificultad
- ✅ Asignar tareas a mecánicos específicos
- ✅ Marcar tareas como completadas
- ✅ Seguimiento de puntos automático

### Leaderboard
- ✅ Ranking en tiempo real de mecánicos
- ✅ Estadísticas mensuales y totales
- ✅ Visualización de progreso individual

### Tiempo Real
- ✅ Actualizaciones instantáneas cuando se agregan/editan carros
- ✅ Notificaciones en tiempo real de cambios en tareas
- ✅ Sincronización automática del leaderboard

## 🔧 Scripts Disponibles

### Backend (astrobuild-backend-vercel)
```bash
npm start          # Producción
npm run dev        # Desarrollo con nodemon
npm run db:migrate # Ejecutar migraciones PostgreSQL
npm run db:health  # Verificar conexión BD
```

### Frontend
```bash
npm run dev      # Desarrollo
npm run build    # Construir para producción
npm start        # Servir build de producción
npm run lint     # Linter
```

## 📊 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario

### Carros
- `GET /api/cars` - Listar carros
- `POST /api/cars` - Crear carro
- `PUT /api/cars/:id` - Actualizar carro
- `DELETE /api/cars/:id` - Eliminar carro

### Tareas
- `GET /api/tasks` - Listar tareas
- `POST /api/tasks` - Crear tarea
- `PUT /api/tasks/:id` - Actualizar tarea
- `DELETE /api/tasks/:id` - Eliminar tarea

### Usuarios
- `GET /api/users` - Listar usuarios
- `GET /api/users/leaderboard` - Ranking de mecánicos
- `GET /api/users/stats` - Estadísticas generales

## 🔐 Seguridad

- Autenticación JWT con tokens seguros
- Contraseñas encriptadas con bcrypt
- Validación de entrada en todos los endpoints
- Headers de seguridad CORS configurados

## 🚀 Deployment

### Backend (Vercel/Railway/Heroku)
1. Usar `astrobuild-backend-vercel` folder (PostgreSQL optimizado)
2. Configurar variables de entorno (SUPABASE_DB_URL)
3. Deploy automático ejecuta migraciones

### Frontend (Vercel/Netlify)
1. Configurar `NEXT_PUBLIC_API_URL`
2. Build y deploy automático

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia ISC.

## 👨‍💻 Desarrollado por

AstroBuild Team - Sistema de gestión para talleres automotrices

---

¡Optimiza tu taller con AstroBuild List! 🚗⚡