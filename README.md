# Pasaporte NFC & Fidelización Gamificada 🎟️📱

Plataforma integral de fidelización, gamificación y red social basada en tecnología **NFC** y fallback por **Código QR**, con arquitectura desacoplada: **Frontend React PWA + Vite** y **Backend Node.js + Express + PostgreSQL + Cloudflare R2**.

---

## 🏗️ Arquitectura del Repositorio

```bash
pasaporte-nfc-project/
├── .github/workflows/deploy.yml   # Automatización CI/CD
├── docs/                          # Esquema SQL y Diagrama ERD
├── frontend/                      # Aplicación PWA React (Vite, Tailwind, TypeScript)
└── backend/                       # API REST Express (PostgreSQL, Cloudflare R2, JWT)
```

---

## 🚀 Requisitos Previos

- **Node.js**: v18 o superior (v20+ recomendado)
- **PostgreSQL**: v14 o superior
- **Cuenta Cloudflare R2**: (Para almacenamiento S3 de clips multimedia)

---

## ⚙️ Configuración del Backend

1. Entra a la carpeta de backend:
   ```bash
   cd backend
   npm install
   ```

2. Configura las variables de entorno en `.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL=postgresql://postgres:password@localhost:5432/pasaporte_nfc_db
   JWT_SECRET=tu_clave_secreta_super_segura
   JWT_EXPIRES_IN=7d

   # Cloudflare R2 / AWS S3
   R2_ACCOUNT_ID=tu_account_id
   R2_ACCESS_KEY_ID=tu_access_key
   R2_SECRET_ACCESS_KEY=tu_secret_key
   R2_BUCKET_NAME=pasaporte-media
   R2_PUBLIC_URL=https://media.tudominio.com
   ```

3. Inicializa la base de datos ejecutando `docs/init_database.sql` en tu servidor PostgreSQL.

4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   El servidor responderá en: `http://localhost:5000`

---

## 📱 Configuración del Frontend (PWA)

1. Entra a la carpeta del frontend:
   ```bash
   cd frontend
   npm install
   ```

2. Verifica las variables de entorno en `.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

3. Inicia la aplicación en modo desarrollo:
   ```bash
   npm run dev
   ```
   Accede a la app en: `http://localhost:5173`

---

## 🛡️ Características Principales

- **Web NFC API**: Lectura directa de tags NFC desde navegadores móviles compatibles (Chrome Android).
- **QR Code Fallback**: Si el dispositivo no cuenta con hardware NFC, permite escanear el QR del comercio.
- **Motor Antifraude**:
  - Restricción de tiempo configurable entre visitas al mismo establecimiento.
  - Validación de geolocalización por radio de proximidad.
  - Huella de dispositivo e IP.
- **Red Social de Experiencias**:
  - Micro-videos de 5 a 7 segundos optimizados y subidos a Cloudflare R2.
  - Feed interactivo con likes y comentarios.
- **Gamificación**:
  - Puntos por visita, niveles de usuario (Bronce, Plata, Oro, Diamante).
  - Catálogo de recompensas y cupones canjeables.
