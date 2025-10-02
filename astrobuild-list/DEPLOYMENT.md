# Guía de Despliegue - AstroBuild List

## Frontend (Netlify) ✅
- Ya está desplegado en Netlify
- Ubicación de archivos: `frontend/out/`

## Backend ✅ (PostgreSQL/Supabase Ready)
Backend migrado a PostgreSQL/Supabase en `astrobuild-backend-vercel` folder.

### Opciones recomendadas:

#### 1. **Vercel** (Recomendado)
```bash
# Instalar Vercel CLI
npm install -g vercel

# En la carpeta astrobuild-backend-vercel/
vercel
vercel env add SUPABASE_DB_URL
```

#### 2. **Render** (Gratis con limitaciones)
1. Conecta tu repo a Render.com
2. Selecciona la carpeta `astrobuild-backend-vercel/`
3. Comando de build: `npm install`
4. Comando de start: `npm start`

#### 3. **Heroku** (Fácil pero de pago)
```bash
# En la carpeta astrobuild-backend-vercel/
heroku create tu-app-name
git push heroku main
```

### Después del despliegue del backend:

1. **Obtén la URL del backend desplegado** (ej: https://tu-backend.railway.app)

2. **Actualiza el archivo `.env.production`:**
```bash
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app/api
```

3. **Reconstruye el frontend:**
```bash
cd frontend/
npm run build
```

4. **Arrastra la nueva carpeta `out/` a Netlify**

### Variables de entorno del backend:
```
SUPABASE_DB_URL=postgresql://postgres.xxxx:password@aws-xx.pooler.supabase.com:6543/postgres
PORT=4000
FRONTEND_URL=https://tu-frontend.netlify.app
```

### Base de datos:
- ✅ PostgreSQL/Supabase (production-ready)
- ✅ Migraciones automáticas incluidas
- ✅ Connection pooling optimizado para serverless