# Pasaporte NFC — Plataforma de Fidelización y Experiencias

WebApp (PWA) + API REST para conectar usuarios con establecimientos aliados mediante tarjeta NFC física, acumulación de sellos/puntos, recompensas y comunidad de experiencias.

Stack: **React + TypeScript + Tailwind + Vite** (frontend) · **Node.js + Express + PostgreSQL + JWT** (backend) · **Cloudflare R2** (multimedia, opcional).

---

## Estructura

```
pasaporte_digital_nfc-main/
├── docs/
│   └── init_database.sql      # Esquema completo + seeds (roles, niveles, categorías)
├── backend/                   # API REST
└── frontend/                  # PWA React
```

---

## Requisitos

- Node.js 18+ (recomendado 20)
- PostgreSQL 14+
- (Opcional) Cuenta Cloudflare R2

---

## 1. Base de datos

```bash
# Crear la base de datos en PostgreSQL
createdb pasaportedigital_db

# Ejecutar el esquema completo + datos iniciales
psql -d pasaportedigital_db -f pasaporte.sql
```

El script `pasaporte.sql` es 100% autónomo e idempotente: crea todas las tablas, índices antifraude, niveles de gamificación, categorías y las cuentas de prueba iniciales (`Admin`, `Comercio` y `Cliente`) listas para iniciar sesión.

---

## 2. Backend

```bash
cd backend
cp .env.example .env
# Edita DATABASE_URL, JWT_SECRET, etc.

npm install
npm run dev
```

API en `http://localhost:5000`  
Health: `GET /health`

### Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/register | Registro |
| POST | /api/auth/login | Login |
| GET | /api/auth/profile | Perfil (JWT) |
| POST | /api/nfc/asignar-tarjeta | Vincular UID NFC al usuario |
| GET | /api/nfc/historial | Historial de sellos |
| POST | /api/nfc/validar-nfc | Validar visita por NFC (COMERCIO/ADMIN) |
| POST | /api/nfc/validar | Validación manual |
| GET | /api/social/feed | Feed comunidad |
| POST | /api/social/publicaciones | Crear publicación |
| GET | /api/rewards | Catálogo de recompensas |
| POST | /api/rewards/canjear | Canjear puntos |

---

## 3. Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api

npm install
npm run dev
```

App en `http://localhost:5173`

### Pantallas

- **Auth**: Login / Registro / Recuperar
- **Usuario**: Pasaporte (wallet + historial + vincular NFC), Feed, Recompensas
- **Comercio**: Validar visitas por UID NFC
- **Admin**: Panel base (extensible)

---

## Flujo de prueba rápido

1. Registrar un usuario (rol CLIENTE por defecto).
2. En el pasaporte, vincular un UID de prueba (ej. `04:TEST:UID:01`).
3. Crear un establecimiento y una regla de sellos en PostgreSQL (o vía admin futuro).
4. Registrar un segundo usuario con rol `COMERCIO` (o cambiar el rol en BD).
5. Desde el panel Comercio, validar el UID del cliente + ID del establecimiento.
6. Ver sellos y puntos actualizados en el pasaporte del cliente.

### Ejemplo SQL para un local de prueba

```sql
INSERT INTO establecimientos (categoria_id, ruc, razon_social, direccion)
SELECT id, '20100000001', 'Café Demo NFC', 'Av. Ejemplo 123'
FROM categorias_establecimiento WHERE nombre = 'Café y Postres' LIMIT 1;

INSERT INTO reglas_sellos (establecimiento_id, nombre_accion, valor_puntos_por_sello, limite_diario_por_usuario)
SELECT id, 'Consumo en local', 15, 2 FROM establecimientos WHERE ruc = '20100000001';
```

---

## Seguridad (resumen del informe)

- La tarjeta solo lleva UID; puntos y datos viven en el servidor.
- Validación siempre requiere acción del comercio (no basta el tap).
- Límites diarios por usuario/local (anti-fraude).
- JWT con expiración, roles, HTTPS en producción.
- Cumplimiento orientado a Ley 29733 (Perú): consentimiento, contraseñas hasheadas, moderación.

---

## Despliegue sugerido (MVP)

- **Alfa**: Render / Railway (gratis) o localhost + Docker.
- **Beta**: VPS Hetzner / DigitalOcean (~S/15–55/mes).
- **Media**: Cloudflare R2 (10 GB gratis, sin egress).

Ver informe completo (`Informe_Pasaporte_NF.docx`) para presupuesto, cronograma y comparativas.

---

## Licencia

Proyecto privado — uso según acuerdos del equipo.
