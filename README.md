# 🌐 Pasaporte Digital NFC — Plataforma de Fidelización y Turismo

[![Versión](https://img.shields.io/badge/Versión-v1.0.0--RC-emerald.svg)](https://github.com/)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%20%7C%20TypeScript-blue.svg)](https://nodejs.org/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20Tailwind-61dafb.svg)](https://vitejs.dev/)
[![Base de Datos](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ecf8e.svg)](https://supabase.com/)
[![Despliegue](https://img.shields.io/badge/Hosting-Render%20Ready-black.svg)](https://render.com/)

Plataforma integral web progresiva (PWA) y API REST de fidelización, turismo y gamificación cultural. Conecta a turistas y clientes con comercios afiliados y sitios patrimoniales mediante **tarjetas físicas NFC** y códigos QR dinámicos, permitiendo acumular sellos digitales interactivos, subir de nivel, canjear recompensas y compartir vivencias en una comunidad social.

---

## 📌 Tabla de Contenidos
1. [Descripción General](#-descripción-general)
2. [Arquitectura y Stack Tecnológico](#-arquitectura-y-stack-tecnológico)
3. [Módulos y Roles de Usuario](#-módulos-y-roles-de-usuario)
4. [Estructura del Proyecto](#-estructura-del-proyecto)
5. [Configuración Local y Desarrollo](#-configuración-local-y-desarrollo)
6. [Guía de Despliegue en Producción (Render + Supabase)](#-guía-de-despliegue-en-producción-render--supabase)
7. [Historial de Versiones y Changelog](#-historial-de-versiones-y-changelog)
8. [Registro de Errores Resueltos (Troubleshooting)](#-registro-de-errores-resueltos-troubleshooting)
9. [Preguntas Frecuentes (FAQ) & Próximos Pasos](#-preguntas-frecuentes-faq--próximos-pasos)

---

## 📖 Descripción General

El **Pasaporte Digital NFC** digitaliza la experiencia de viajar y consumir localmente:
- **Turistas y Clientes**: Cuentan con un wallet digital donde coleccionan sellos con estética de pasaporte oficial, acumulan puntos, canjean promociones y publican historias en el feed comunitario.
- **Comercios y Locales**: Validan visitas físicas leyendo la tarjeta NFC del cliente con un smartphone o mediante lectura manual/QR, otorgando sellos al instante y gestionando recompensas por lealtad.
- **Lugares Turísticos y Monumentos**: Sitios culturales y patrimoniales que otorgan sellos y badges de explorador sin requerir compras comerciales.
- **Administradores**: Monitorean métricas globales, gestionan comercios, categorías estandarizadas, moderación social y el catálogo maestro de sellos.

---

## ⚙️ Arquitectura y Stack Tecnológico

```
┌──────────────────────────────────────────────────────────┐
│                   Cliente (Browser / PWA)                 │
│         React 18 · TypeScript · Vite · Tailwind CSS       │
│          Lucide Icons · Web NFC API · ZXing QR Scanner    │
└────────────────────────────┬─────────────────────────────┘
                             │ HTTPS / REST API
                             ▼
┌──────────────────────────────────────────────────────────┐
│               Backend (Node.js + Express)                │
│         TypeScript · JWT Auth · Multer · Bcrypt          │
│                Health Check: /health                     │
└────────────────────────────┬─────────────────────────────┘
                             │ SSL (require / rejectUnauthorized)
                             ▼
┌──────────────────────────────────────────────────────────┐
│            Base de Datos (Supabase PostgreSQL)           │
│        Esquema relacional con integridad referencial     │
│   Índices antifraude · Políticas ON DELETE CASCADE       │
└──────────────────────────────────────────────────────────┘
```

### Tecnologías:
- **Frontend**: React 18, TypeScript, Vite 5, Tailwind CSS, Lucide Icons, Axios, React Router v6.
- **Backend**: Node.js 20, Express, TypeScript, PG (node-postgres), JSON Web Token (JWT), Multer.
- **Base de Datos**: PostgreSQL alojado en Supabase con conexión segura SSL y pooling.
- **Hardware/NFC**: Integración con Web NFC API (`NDEFReader`) y fallback con lectores USB/Serial y códigos QR.

---

## 👥 Módulos y Roles de Usuario

| Rol | Módulo / Rutas | Funcionalidades Principales |
|---|---|---|
| **CLIENTE / TURISTA** | `/passport`, `/rewards`, `/feed`, `/locales`, `/explorar` | Wallet de sellos digitales interactivos, historial de visitas, vinculación de tarjeta NFC, catálogo de recompensas, favoritos, publicación en feed social. |
| **COMERCIO / LOCAL** | `/commerce`, `/commerce/validar`, `/commerce/sellos`, `/commerce/perfil`, `/commerce/recompensas` | Dashboard de visitas del día/mes, validación de tarjetas NFC en 1 toque, personalización de logotipo y portada, creación de programas de fidelización y recompensas. |
| **ADMINISTRADOR** | `/admin`, `/admin/locales`, `/admin/sellos`, `/admin/categorias`, `/admin/usuarios`, `/admin/feed` | Control de establecimientos y sucursales, edición de sellos oficiales para lugares turísticos, estandarización de categorías con íconos vectoriales, moderación de usuarios y reportes. |

---

## 📁 Estructura del Proyecto

```
virtualpassport/
├── backend/
│   ├── src/
│   │   ├── config/          # Conexión a base de datos PostgreSQL (Supabase)
│   │   ├── controllers/     # Controladores (auth, establishments, admin, nfc, rewards, etc.)
│   │   ├── middlewares/     # JWT auth, roles, subida de archivos (multer)
│   │   ├── routes/          # Definición de rutas Express (/api/...)
│   │   ├── utils/           # Manejador de errores ApiError, helpers de respuesta
│   │   └── server.ts        # Punto de entrada Express y Health Check (/health)
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── public/              # Manifiesto PWA, iconos, _redirects para SPA
│   ├── src/
│   │   ├── components/      # Componentes reutilizables (DigitalStampBadge, CategoryIcon, etc.)
│   │   ├── hooks/           # useAuth, useUI, hooks personalizados
│   │   ├── pages/           # Vistas separadas por rol (admin/, commerce/, user/, auth/)
│   │   ├── services/        # Cliente Axios centralizado (api.ts)
│   │   └── App.tsx          # Enrutamiento protegido por roles
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── docs/                    # Scripts SQL de inicialización y mantenimiento
└── README.md
```

---

## 💻 Configuración Local y Desarrollo

### Requisitos Previos:
- **Node.js** 18.x o 20.x LTS
- **npm** 9.x o superior
- Proyecto PostgreSQL activo en **Supabase**

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-organizacion/virtualpassport.git
cd virtualpassport
```

### 2. Configurar Backend
```bash
cd backend
cp .env.example .env
npm install
```
Edita `.env` con tus credenciales:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require
JWT_SECRET=super_secret_jwt_key_with_at_least_32_characters_random
CLIENT_ORIGIN=http://localhost:5173
```
Iniciar servidor de desarrollo:
```bash
npm run dev
```
Verifica en tu navegador: `http://localhost:5000/health` → `{"status": "OK"}`.

### 3. Configurar Frontend
En una nueva terminal:
```bash
cd frontend
cp .env.example .env
npm install
```
Edita `.env`:
```env
VITE_API_URL=http://localhost:5000/api
```
Iniciar servidor de desarrollo:
```bash
npm run dev
```
Accede en `http://localhost:5173`.

---

## 🚀 Guía de Despliegue en Producción (Render + Supabase)

### Paso 1: Base de Datos en Supabase
1. Ingresa a [supabase.com](https://supabase.com/) y crea un proyecto.
2. En **Project Settings** → **Database**, copia la **Connection String (URI)** en modo Transaction o Session Pooling.
3. Asegúrate de que termine con `?sslmode=require`.

### Paso 2: Despliegue del Backend en Render (Web Service)
1. En el dashboard de [Render](https://dashboard.render.com/), haz clic en **New +** → **Web Service**.
2. Conecta tu repositorio de GitHub.
3. Configura los siguientes campos:
   - **Name**: `virtualpassport-backend`
   - **Region**: Selecciona la más cercana (ej. Oregon / Frankfurt / Ohio).
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start` (o `node dist/server.js`)
   - **Health Check Path**: `/health`
4. En **Environment Variables**, agrega:
   | Variable | Valor Recomendado |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require` |
   | `JWT_SECRET` | *(Clave aleatoria segura de al menos 32 caracteres)* |
   | `CLIENT_ORIGIN` | `https://tu-frontend.onrender.com` *(o `*` para pruebas iniciales)* |
5. Haz clic en **Create Web Service**. Espera a que el build finalice y verifica que `/health` responda `{"status":"OK"}`.

### Paso 3: Despliegue del Frontend en Render (Static Site)
1. En Render, haz clic en **New +** → **Static Site**.
2. Conecta el mismo repositorio de GitHub.
3. Configura los siguientes campos:
   - **Name**: `virtualpassport-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. En **Environment Variables**, agrega:
   | Variable | Valor |
   |---|---|
   | `VITE_API_URL` | `https://virtualpassport-backend.onrender.com/api` |
5. En la pestaña **Redirects / Rewrites** de Render (o mediante el archivo `public/_redirects` ya incluido en el proyecto):
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite`
6. Haz clic en **Create Static Site**.

---

## 📋 Historial de Versiones y Changelog

### Version 1.0.0-RC1 (Ready for Production / Hosting Test)
- **Panel de Comercio (Inicio)**:
  - Eliminado emoji fijo (`☕`).
  - Encabezado dinámico con logotipo del establecimiento o ícono oficial de su categoría.
- **Gestión de Sellos Administrativa**:
  - Restricción del botón "Editar" en `AdminSellos` exclusivamente para **lugares turísticos y monumentos** (los locales gestionan sus sellos desde su propio panel).
  - Selector de sellos filtrado a insignias vectoriales orientadas a **turismo y experiencias**.
- **Limpieza y Estandarización de Categorías**:
  - Eliminación de categorías redundantes con emojis.
  - Adopción integral del sistema de íconos vectoriales modernos con [`CategoryIcon`](file:///c:/Users/JOSE%20ALDAIR/Desktop/virtualpassport/frontend/src/components/common/CategoryIcon.tsx).
- **Detalle de Local y Sellos**:
  - Sincronización del diseño de sello en la vista cliente [`LocalDetailPage.tsx`](file:///c:/Users/JOSE%20ALDAIR/Desktop/virtualpassport/frontend/src/pages/user/LocalDetailPage.tsx) coincidente con el panel de administración.
- **Builds de Producción Verificados**:
  - Backend `tsc` y Frontend `tsc && vite build` compilando con **0 errores**.

---

## 🛠️ Registro de Errores Resueltos (Troubleshooting)

Durante el desarrollo y estabilización de la versión 1.0.0 se resolvieron los siguientes puntos críticos:

### 1. Error de Clave Foránea (`23503`) al Limpiar Tablas en Supabase
- **Causa**: Al depurar usuarios de prueba, la tabla `aceptaciones_legales` mantenía referencias `RESTRICT` hacia `usuarios(id_usuario)`.
- **Solución**: Se actualizó la restricción de clave foránea a `ON DELETE CASCADE`:
  ```sql
  ALTER TABLE aceptaciones_legales DROP CONSTRAINT aceptaciones_legales_id_usuario_fkey;
  ALTER TABLE aceptaciones_legales ADD CONSTRAINT aceptaciones_legales_id_usuario_fkey
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE;
  ```

### 2. Error `42P10` en Sentencia `ON CONFLICT` en Supabase
- **Causa**: La cláusula `ON CONFLICT (id_usuario)` no coincidía con una restricción única explícita en la tabla destino.
- **Solución**: Creación del índice único correspondiente:
  ```sql
  CREATE UNIQUE INDEX IF NOT EXISTS uq_aceptaciones_legales_id_usuario ON aceptaciones_legales(id_usuario);
  ```

### 3. Error 500 en Actualización de Sellos (`could not determine data type of parameter $6`)
- **Causa**: En PostgreSQL, al enviar valores nulos o no tipados dentro de `COALESCE($6, meta_sellos)`, el motor no infería el tipo de dato.
- **Solución**: Se aplicó casteo explícito en los parámetros SQL en `admin.controller.ts`:
  ```sql
  meta_sellos = COALESCE($6::int, meta_sellos),
  puntos_por_visita = COALESCE($7::numeric, puntos_por_visita)
  ```

### 4. Categorías Duplicadas con Emojis
- **Causa**: Inserciones anteriores generaron categorías duplicadas que usaban emojis en lugar de claves de íconos estandarizadas.
- **Solución**: Se consolidaron y reasignaron las referencias de establecimientos hacia las categorías oficiales limpias, eliminando los registros obsoletos.

---

## ❓ Preguntas Frecuentes (FAQ) & Próximos Pasos

### ¿Cómo pruebo la lectura NFC si no tengo tarjetas físicas?
En el panel del comercio (`/commerce/validar`), dispones de un modo de **Ingreso Manual de UID** y lectura de **Código QR**, lo cual permite validar visitas desde cualquier dispositivo de prueba sin necesidad de hardware NFC.

### ¿Se pueden subir imágenes en Render si uso el tier gratuito?
En Render el sistema de archivos del tier gratuito es efímero (se reinicia al suspenderse). Para producción definitiva se recomienda enlazar con un bucket S3 o Cloudflare R2 (ya preparado en las dependencias con `@aws-sdk/client-s3`).

### Documentación en GitHub (Wiki y Discusiones)
Al subir el repositorio a GitHub, se recomienda:
1. Activar **GitHub Discussions** para preguntas y sugerencias de la comunidad.
2. Usar la pestaña **Wiki** para guías de onboarding para nuevos locales afiliados y manuales de personal de atención.

---

## 📄 Licencia
Proyecto privado. Desarrollado para la gestión y fidelización con pasaporte digital NFC.
