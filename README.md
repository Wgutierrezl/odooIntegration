# Odoo Integration Platform (Frontend + Backend)

Proyecto full-stack para integrar una plataforma POS universitaria con **Odoo**, permitiendo consultar y sincronizar información de:

- Dashboard
- Empleados
- Productos
- Contactos (clientes/proveedores)
- Ventas
- CRM
- Usuarios y autenticación

## Arquitectura

- **Backend**: NestJS + TypeScript + SQLite (`backend_odoo_integration`)
- **Frontend**: React + Vite + TypeScript + Tailwind (`frontend_odoo_integration`)
- **Integración externa**: Odoo vía XML-RPC/API key

## Puertos

- **Frontend**: `http://localhost:5173` (Vite dev server)
- **Backend API**: `http://localhost:3033`
- Prefijo global del backend: `/api`  
  Ejemplo: `http://localhost:3033/api`

> Nota: El frontend usa proxy de Vite para enviar `/api` hacia `http://localhost:3033`.

## Requisitos

Instala antes de correr el proyecto:

- **Node.js** 20+ (recomendado LTS)
- **npm** 10+

## Instalación

Desde la raíz del repositorio:

```bash
cd backend_odoo_integration
npm install

cd ../frontend_odoo_integration
npm install
```

## Configuración de entorno (Backend)

Crear/editar el archivo:

- `backend_odoo_integration/.env`

Variables usadas por el backend:

```env
ODOO_URL=
ODOO_DB=
ODOO_USERNAME=
ODOO_API_KEY=
ODOO_TIMEOUT_MS=15000
ODOO_MAX_RETRIES=3
ODOO_SYNC_INTERVAL_MINUTES=5

DATABASE_PATH=./data/platform.db

JWT_SECRET=
JWT_EXPIRATION=8h

PORT=3033
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## Cómo levantar el proyecto (desarrollo)

### 1) Backend

```bash
cd backend_odoo_integration
npm run start:dev
```

### 2) Frontend

En otra terminal:

```bash
cd frontend_odoo_integration
npm run dev
```

## Scripts útiles

### Backend

```bash
npm run start:dev   # modo desarrollo con watch
npm run build       # compilar
npm run start:prod  # correr build
npm run test        # tests
```

### Frontend

```bash
npm run dev         # desarrollo
npm run build       # build producción
npm run preview     # previsualizar build
npm run lint        # lint
```

## Flujo de llamadas

- El frontend consume `'/api'` (base URL relativa).
- Vite proxya `'/api'` al backend (`http://localhost:3033`).
- El backend expone rutas bajo prefijo global `'/api'`.

## Estructura

```text
.
├── backend_odoo_integration/
└── frontend_odoo_integration/
```

