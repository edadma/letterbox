# Letterbox

A modern monorepo application with React frontends and AdonisJS backend.

## Project Structure

```
letterbox/
├── apps/
│   ├── web/          # Main React frontend
│   ├── admin/        # Admin panel
│   └── api/          # AdonisJS backend
├── docker-compose.yml
├── init-db.sql
└── package.json
```

## Tech Stack

### Frontend (Web & Admin)
- React 18
- TypeScript
- Vite
- TanStack Query
- Tailwind CSS
- DaisyUI

### Backend (API)
- AdonisJS 6
- PostgreSQL
- Session-based authentication
- Server-Sent Events (SSE)
- Resend (email)
- Tuyau (type-safe API client)

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm or yarn

## Quick Start

### 1. Start PostgreSQL Database

```bash
docker-compose up -d
```

This will start PostgreSQL on port 5432 with:
- Database: `letterbox`
- User: `postgres` (dev) / `letterbox_user` (prod)
- Password: `postgres` (dev) / configure in production

### 2. Install Dependencies

```bash
npm install
```

This installs dependencies for all workspaces (web, admin, api).

### 3. Configure Environment

The API `.env` file has been created with defaults. Update if needed:

```bash
cd apps/api
# Edit .env file to add your RESEND_API_KEY and other configuration
```

### 4. Run Migrations

```bash
cd apps/api
npm run migration:run
```

### 5. Start Development Servers

```bash
# From root directory, start all apps:
npm run dev

# Or start individually:
npm run web
npm run admin
npm run api
```

## Development

### Web Frontend (Port 5173)

```bash
npm run web
```

The web app proxies `/api` requests to the backend at `http://localhost:3333`.

### Admin Panel (Port 5175)

```bash
npm run admin
```

The admin panel also proxies `/api` requests to the backend.

### API Backend (Port 3333)

```bash
npm run api
```

API endpoints:
- `GET /` - API info
- `GET /events/stream` - Server-Sent Events stream
- `POST /events/trigger` - Trigger an event

### Database

#### Run Migrations

```bash
cd apps/api
node ace migration:run
```

#### Create a Migration

```bash
cd apps/api
node ace make:migration <migration_name>
```

#### Create a Seeder

```bash
cd apps/api
node ace make:seeder <seeder_name>
```

#### Run Seeders

```bash
cd apps/api
node ace db:seed
```

### Email Configuration

The backend is configured to use Resend for email. Add your API key to `apps/api/.env`:

```env
RESEND_API_KEY=your_resend_api_key
```

### Server-Sent Events

Connect to real-time events:

```javascript
const eventSource = new EventSource('http://localhost:3333/events/stream')
eventSource.onmessage = (event) => {
  console.log(JSON.parse(event.data))
}
```

## Building for Production

### Build All Apps

```bash
npm run build
```

### Build Individual Apps

```bash
npm run build -w apps/web
npm run build -w apps/admin
npm run build -w apps/api
```

### Production Deployment

#### API

```bash
cd apps/api
npm run build
cd build
npm ci --omit="dev"
node bin/server.js
```

Update production environment variables:
- Set strong `APP_KEY`
- Configure `DB_USER=letterbox_user`
- Set strong database password
- Add production `RESEND_API_KEY`

#### Frontend Apps

The web and admin apps are static builds in `apps/web/dist` and `apps/admin/dist`.
Deploy to any static hosting service (Vercel, Netlify, Cloudflare Pages, etc.).

## Docker

### PostgreSQL Database

The `docker-compose.yml` file sets up PostgreSQL with:
- Persistent volume
- Health checks
- Initialization script for `letterbox_user`

For production, update `init-db.sql` with a strong password for `letterbox_user`.

## Type Safety with Tuyau

Tuyau provides end-to-end type safety between the API and frontends.

Generate types from API:

```bash
cd apps/api
npm run tuyau:generate
```

This creates type definitions that can be imported in the web and admin apps.

## Scripts Reference

### Root Level
- `npm run dev` - Start all apps in development
- `npm run build` - Build all apps
- `npm run web` - Start web app only
- `npm run admin` - Start admin app only
- `npm run api` - Start API only

### API (apps/api)
- `npm run dev` - Start dev server with HMR
- `npm run build` - Build for production
- `npm run start` - Start production server
- `node ace migration:run` - Run migrations
- `node ace db:seed` - Run seeders
- `node ace make:migration <name>` - Create migration
- `node ace make:seeder <name>` - Create seeder
- `node ace make:controller <name>` - Create controller
- `node ace make:model <name>` - Create model

## License

UNLICENSED
