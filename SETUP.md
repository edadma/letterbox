# Letterbox Setup Summary

## What's Been Created

A complete monorepo with:

### Applications
1. **Web App** (`apps/web`) - Main React frontend on port 5173
2. **Admin Panel** (`apps/admin`) - Admin dashboard on port 5175
3. **API** (`apps/api`) - AdonisJS backend on port 3333

### Key Features Configured

#### Frontend Apps (Web & Admin)
- React 18 with TypeScript
- Vite for fast development
- TanStack Query for data fetching
- Tailwind CSS for styling
- DaisyUI component library
- Tuyau client for type-safe API calls
- API proxy configuration to backend

#### Backend (API)
- AdonisJS 6 API kit
- PostgreSQL database (Lucid ORM)
- Session-based authentication with HTTP-only cookies
- Server-Sent Events (SSE) support at `/events/stream`
- Resend email integration
- Encryption support via APP_KEY
- Tuyau for type-safe route definitions
- CORS configured
- Migration and seeder support

#### Infrastructure
- Docker Compose for PostgreSQL
- Database initialization script with production user setup
- Environment configuration (.env and .env.example)
- Comprehensive .gitignore

## Directory Structure

```
letterbox/
├── apps/
│   ├── web/                    # Main frontend
│   │   ├── src/
│   │   │   ├── App.tsx        # Landing page with Letterbox branding
│   │   │   └── index.css      # Tailwind + DaisyUI imports
│   │   ├── vite.config.ts     # Vite config with Tailwind plugin
│   │   └── package.json
│   ├── admin/                  # Admin panel
│   │   ├── src/
│   │   │   ├── App.tsx        # Admin dashboard with sidebar
│   │   │   └── index.css      # Tailwind + DaisyUI imports
│   │   ├── vite.config.ts     # Vite config on port 5174
│   │   └── package.json
│   └── api/                    # Backend
│       ├── app/
│       │   └── controllers/
│       │       └── events_controller.ts  # SSE implementation
│       ├── config/
│       │   ├── database.ts    # PostgreSQL config
│       │   └── mail.ts        # Resend config
│       ├── database/
│       │   ├── migrations/
│       │   └── seeders/
│       ├── start/
│       │   └── routes.ts      # API routes
│       ├── .env               # Environment config with APP_KEY
│       ├── .env.example       # Example environment
│       └── package.json
├── docker-compose.yml          # PostgreSQL container
├── init-db.sql                # Database initialization
├── package.json               # Workspace configuration
├── README.md                  # Full documentation
└── .gitignore

```

## Database Configuration

### Development
- Host: localhost:5432
- Database: letterbox
- User: postgres
- Password: postgres

### Production
- Database: letterbox
- User: letterbox_user
- Password: Update in `init-db.sql` before deployment

## Environment Variables

The API `.env` file includes:

```env
TZ=UTC
PORT=3333
HOST=localhost
LOG_LEVEL=info
APP_KEY=<generated>
NODE_ENV=development

# Database
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_DATABASE=letterbox

# Session
SESSION_DRIVER=cookie

# Mail (Resend)
RESEND_API_KEY=
MAIL_FROM_ADDRESS=noreply@letterbox.app
MAIL_FROM_NAME=Letterbox
```

## Next Steps

### 1. Start PostgreSQL
```bash
docker-compose up -d
```

### 2. Run Migrations (when created)
```bash
cd apps/api
node ace migration:run
```

### 3. Start Development
```bash
# From root
npm run dev

# Or individually
npm run web
npm run admin
npm run api
```

### 4. Add Your First Migration
```bash
cd apps/api
node ace make:migration create_users_table
```

### 5. Configure Email
Add your Resend API key to `apps/api/.env`:
```env
RESEND_API_KEY=re_xxxxx
```

## API Endpoints

- `GET /` - API info
- `GET /events/stream` - Server-Sent Events stream
- `POST /events/trigger` - Trigger an SSE event

## Build Status

All applications successfully build:
- Web: ✓ Built
- Admin: ✓ Built
- API: ✓ Built

## Notes

- The Tailwind CSS warnings about `@property --radialprogress` are expected and can be ignored (DaisyUI feature)
- Both frontend apps proxy `/api/*` requests to `http://localhost:3333`
- Session cookies are HTTP-only for security
- APP_KEY has been generated for encryption
- The SSE endpoint maintains long-lived connections for real-time updates
