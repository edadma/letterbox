# Letterbox

A multi-tenant email system with role-based access control, built as a monorepo with React frontends and AdonisJS backend.

## Project Structure

```
letterbox/
├── apps/
│   ├── web/          # User email client (personal mailboxes)
│   ├── admin/        # Account admin panel (manages account emails)
│   ├── sysadmin/     # System admin panel (platform-wide management)
│   └── api/          # AdonisJS backend with multi-tenant support
├── docker-compose.yml
├── init-db.sql
└── package.json
```

## Features

- Multi-tenant email system with separate accounts
- Role-based access control (user, admin, sysadmin)
- Email sending and receiving via Resend
- Real-time email updates with Server-Sent Events
- Session-based authentication with HTTP-only cookies
- Account-specific Resend API key management

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

This will start PostgreSQL on port 5434 with:
- Database: `letterbox`
- User: `postgres` (dev) / `letterbox_user` (prod)
- Password: `postgres` (dev) / configure in production

### 2. Install Dependencies

```bash
npm install
```

This installs dependencies for all workspaces (web, admin, api).

### 3. Configure Environment

Copy the example environment file and configure:

```bash
cd apps/api
cp .env.example .env
# Edit .env file to add your configuration
```

Required environment variables:
- `RESEND_API_KEY` - Your Resend API key (must have Full Access)
- `BOOTSTRAP_DOMAIN` - Default account domain (e.g., letterbox.to)
- `BOOTSTRAP_ADMIN_EMAIL` - Initial admin email
- `BOOTSTRAP_ADMIN_PASSWORD` - Initial admin password

### 4. Run Migrations & Seeders

```bash
cd apps/api
node ace migration:run
node ace db:seed
```

This creates the database schema and bootstraps the initial account.

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

User email client where individual users can:
- Login with their email credentials
- Send and receive emails
- View only their personal emails

```bash
npm run web
```

### Admin Panel (Port 5175)

Account admin interface where account administrators can:
- View all emails for their account
- Manage account settings
- See all users in their account

```bash
npm run admin
```

### Sysadmin Panel (Port 5176)

System admin interface for platform-wide management where sysadmins can:
- View all accounts across the platform
- Monitor system activity
- Manage platform settings

```bash
npm run sysadmin
```

### API Backend (Port 3333)

```bash
npm run api
```

Authentication endpoints:
- `POST /auth/register-account` - Register new account with Resend API key
- `POST /auth/register-user` - Register user within existing account
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user info

Email endpoints (protected):
- `POST /mail/send` - Send email using account's Resend key
- `GET /events/stream` - SSE stream for real-time email updates
- `GET /events/recent-emails` - Get recent emails (filtered by role)

Webhook endpoints (public):
- `POST /webhooks/inbound-email` - Resend webhook for incoming emails

### Database Commands

#### Run Migrations

```bash
cd apps/api
node ace migration:run
```

#### Run Seeders

```bash
cd apps/api
node ace db:seed
```

#### Fresh Migration (drops all tables and re-runs)

```bash
cd apps/api
node ace migration:fresh
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

## Architecture

### Multi-Tenant Design

Each account has:
- Its own domain (e.g., `company.com`)
- Its own Resend API key
- Multiple users with different roles

### User Roles

- **user** - Regular user, sees only their own emails (emails sent to `their-name@domain`)
- **admin** - Account administrator, sees all emails for their account
- **sysadmin** - System administrator, sees all emails across all accounts

### Email Flow

**Outbound (Sending):**
1. User composes email in web app
2. API uses the account's Resend API key to send
3. Email is saved to database with direction="outbound"

**Inbound (Receiving):**
1. Email arrives at Resend
2. Resend sends webhook to `/webhooks/inbound-email`
3. API fetches full email content from Resend
4. Email is saved to database with direction="inbound"
5. SSE broadcasts to connected clients (filtered by role)

### Resend Configuration

Each account needs:
- A verified domain in Resend
- A Resend API key with Full Access (for receiving emails)
- Webhook configured to point to your API endpoint

The bootstrap account uses environment variables from `.env`.

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
- `npm run web` - Start web app only (port 5173)
- `npm run admin` - Start admin app only (port 5175)
- `npm run sysadmin` - Start sysadmin app only (port 5176)
- `npm run api` - Start API only (port 3333)

### API (apps/api)
- `npm run dev` - Start dev server with HMR
- `npm run build` - Build for production
- `npm run start` - Start production server
- `node ace migration:run` - Run migrations
- `node ace migration:fresh` - Drop all tables and re-run migrations
- `node ace db:seed` - Run seeders
- `node ace make:migration <name>` - Create migration
- `node ace make:seeder <name>` - Create seeder
- `node ace make:controller <name>` - Create controller
- `node ace make:model <name>` - Create model

### Frontend Apps (web/admin)
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## License

UNLICENSED
