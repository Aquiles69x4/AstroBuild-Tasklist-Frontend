# Guía de Deployment en Vercel - AstroBuild List

Esta aplicación está completamente optimizada para deployment en Vercel con configuración serverless.

## 🚀 Estructura del Proyecto

```
astrobuild-list/
├── backend/          # Express.js + SQLite (Serverless Functions)
├── frontend/         # Next.js + TypeScript
└── VERCEL_DEPLOYMENT_GUIDE.md
```

## 📋 Características Implementadas

✅ **Sistema Completo de Taller Mecánico**
- Gestión de carros y mecánicos
- Sistema de puntos y leaderboard
- Asignación de tareas
- Dashboard en tiempo real con Socket.io

✅ **Optimización para Vercel**
- Backend configurado para Serverless Functions
- Frontend Next.js optimizado
- Variables de entorno configuradas
- TypeScript sin errores
- Build exitoso

## 🔧 Tecnologías

### Backend
- **Express.js** - API REST
- **SQLite** - Base de datos (adaptada para serverless)
- **Socket.io** - Real-time updates
- **Vercel Serverless Functions**

### Frontend
- **Next.js 14** - Framework React
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Socket.io Client** - Real-time

## 🚀 Deployment en Vercel

### Paso 1: Preparar el Backend

1. **Crear proyecto en Vercel para el backend:**
   ```bash
   cd backend
   vercel
   ```

2. **Configurar variables de entorno en Vercel:**
   - `NODE_ENV=production`
   - `JWT_SECRET=your_secure_jwt_secret`
   - `FRONTEND_URL=https://your-frontend-domain.vercel.app`

3. **El backend se deployará automáticamente como Serverless Functions**

### Paso 2: Preparar el Frontend

1. **Actualizar la URL del backend en `.env.production`:**
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend-project.vercel.app/api
   ```

2. **Crear proyecto en Vercel para el frontend:**
   ```bash
   cd frontend
   vercel
   ```

3. **Vercel detectará automáticamente Next.js y configurará el deployment**

### Paso 3: Verificar el Deployment

1. **Backend funcionando:**
   - `https://your-backend.vercel.app/api/health`
   - Debe retornar: `{"status": "OK", "message": "..."}`

2. **Frontend funcionando:**
   - `https://your-frontend.vercel.app`
   - Debe mostrar el dashboard del taller

## 📁 Archivos de Configuración Incluidos

### Backend
- `vercel.json` - Configuración para Serverless Functions
- `.env.example` - Variables de entorno
- `package.json` - Scripts optimizados

### Frontend
- `vercel.json` - Configuración para Next.js
- `next.config.js` - Optimizado para Vercel
- `.env.production` - Variables para production
- `.env.example` - Template para development

## 🗃️ Base de Datos

- **Desarrollo:** SQLite local en `backend/data/`
- **Producción:** SQLite en `/tmp` (reinicializada automáticamente)
- **Schema:** Se crea automáticamente en cada deploy
- **Datos iniciales:** Mecánicos predefinidos incluidos

## 🔗 Endpoints API

- `GET /api/health` - Health check
- `GET /api/cars` - Lista de carros
- `GET /api/mechanics` - Lista de mecánicos
- `GET /api/mechanics/leaderboard` - Ranking de puntos
- `GET /api/tasks` - Lista de tareas
- `POST /api/cars` - Crear carro
- `POST /api/tasks` - Crear tarea

## 🎯 Características del Sistema

### Dashboard Principal
- Vista de taller con gestión de carros
- Leaderboard con ranking de mecánicos
- Interface colaborativa sin autenticación

### Sistema de Puntos
- Puntos automáticos al completar tareas
- Ranking en tiempo real
- Medallas para top 3 mecánicos

### Real-time Updates
- Socket.io para actualizaciones inmediatas
- Sincronización entre usuarios
- Estado compartido

## 🔧 Scripts Disponibles

### Frontend
```bash
npm run dev        # Desarrollo
npm run build      # Build optimizado
npm run type-check # Verificar TypeScript
npm run lint       # Linting
```

### Backend
```bash
npm run dev        # Desarrollo con nodemon
npm run start      # Producción
npm run init-db    # Inicializar base de datos
```

## 🌟 Optimizaciones Implementadas

1. **Serverless Ready:** Backend optimizado para functions
2. **SQLite Adaptado:** Path dinámico development/production
3. **Auto-init Schema:** Base de datos se crea automáticamente
4. **TypeScript:** Sin errores de tipos
5. **Next.js Optimized:** Headers, redirects, performance
6. **Environment Variables:** Configuración completa

## 📞 Soporte

La aplicación está lista para deployment inmediato en Vercel. Todos los archivos de configuración están optimizados y el código está libre de errores.

### Mecánicos Preconfigurados
- IgenieroErick
- ChristianCobra
- Chicanto
- SpiderSteven
- LaBestiaPelua
- PhonKing
- CarlosMariconGay

**¡Disfruta tu taller mecánico digital! 🚗🔧**