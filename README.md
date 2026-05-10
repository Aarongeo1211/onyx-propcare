# Onyx PropCare

Full-stack property listing platform built with a Turborepo monorepo.

## Tech Stack

- **Web** — Next.js 15 (App Router), React 19, Tailwind CSS, NextAuth
- **Admin** — Next.js 15 (App Router), React 19, Tailwind CSS
- **API** — Express 4, Prisma 6, PostgreSQL, Zod validation, Pino logging
- **Payments** — Razorpay with webhook verification
- **Storage** — Cloudinary (images), PostgreSQL (data)
- **Auth** — JWT + Google OAuth, login lockout, password reset with hashed tokens

## Project Structure

```
apps/
  web/          # Buyer/seller-facing Next.js app (port 3000)
  admin/        # Admin panel Next.js app (port 3001)
  api/          # Express REST API (port 4000)
packages/
  db/           # Prisma schema, migrations, client
  types/        # Shared TypeScript types
  ui/           # Shared UI components (Button, Badge, etc.)
  config/       # Shared ESLint + TypeScript configs
```

## Setup

### Prerequisites

- Node.js >= 20
- pnpm 9
- PostgreSQL 15+

### Install

```bash
pnpm install
```

### Environment

Copy example env files and fill in your values:

```bash
cp .env.example .env.local
cp apps/api/.env.example apps/api/.env.local
```

Required variables:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Min 32 chars, generate with `openssl rand -base64 48`
- `CSRF_SECRET` — Min 32 chars
- `NEXTAUTH_SECRET` — Min 32 chars

### Database

```bash
pnpm db:generate          # Generate Prisma client
pnpm db:push              # Push schema to DB (dev only)
# OR
cd packages/db && npx prisma migrate deploy   # Apply migrations (prod)
```

### Run

```bash
pnpm dev          # All apps
pnpm dev:web      # Web only
pnpm dev:admin    # Admin only
pnpm dev:api      # API only
```

### Docker

```bash
docker compose up         # Postgres + Redis + all apps
docker compose up postgres redis   # Just DB + cache for local dev
```

### Test

```bash
pnpm test         # Unit tests (Vitest)
pnpm test:e2e     # E2E tests (Playwright)
```

### Lint

```bash
pnpm lint         # Typecheck + ESLint across all apps
```

## API Endpoints

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | No | Create account |
| POST | `/api/v1/auth/login` | No | Login (email+password) |
| POST | `/api/v1/auth/google` | No | Google OAuth (ID token) |
| POST | `/api/v1/auth/forgot-password` | No | Request password reset |
| POST | `/api/v1/auth/reset-password` | No | Reset password with token |
| POST | `/api/v1/auth/change-password` | Yes | Change password (logged in) |

### Properties
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/properties` | No | List with filters, pagination, FTS |
| GET | `/api/v1/properties/featured` | No | Featured properties (cached) |
| GET | `/api/v1/properties/compare?ids=` | No | Compare up to 3 properties |
| GET | `/api/v1/properties/:slug` | No | Property detail by slug |
| GET | `/api/v1/properties/by-id/:id` | Yes | Property by ID (owner/admin) |
| POST | `/api/v1/properties` | Yes | Create property (plan required) |
| PATCH | `/api/v1/properties/:id` | Yes | Update property (owner) |
| DELETE | `/api/v1/properties/:id` | Yes | Soft-delete property (owner) |

### Users
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/users/me` | Yes | Current user profile |
| PATCH | `/api/v1/users/me` | Yes | Update profile (name, phone) |

### Inquiries
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/inquiries` | Yes | Send inquiry |
| GET | `/api/v1/inquiries` | Yes | List inquiries (role-based) |
| PATCH | `/api/v1/inquiries/:id/status` | Yes | Update status (property owner) |

### Callbacks
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/callbacks` | Yes | Request callback |
| GET | `/api/v1/callbacks` | Yes | List callbacks (role-based) |
| PATCH | `/api/v1/callbacks/:id` | Yes | Update callback status |

### Subscriptions
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/plans` | No | List plans |
| POST | `/api/v1/subscriptions` | Yes | Create subscription |
| POST | `/api/v1/subscriptions/verify` | Yes | Verify Razorpay payment |
| POST | `/api/v1/subscriptions/webhook` | No | Razorpay webhook |

### Favorites
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/favorites` | Yes | List favorites |
| POST | `/api/v1/favorites` | Yes | Add favorite |
| DELETE | `/api/v1/favorites/:propertyId` | Yes | Remove favorite |

### Upload
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/upload/images` | Yes | Upload images to Cloudinary |
| POST | `/api/v1/upload/property-images` | Yes | Link images to property |
| DELETE | `/api/v1/upload/images/:publicId` | Yes | Delete image |

### Admin
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/admin/stats` | Admin | Dashboard stats |
| GET | `/api/v1/admin/properties` | Admin | All properties |
| PATCH | `/api/v1/admin/properties/:id/status` | Admin | Update property status |
| DELETE | `/api/v1/admin/properties/:id` | Admin | Archive property |
| GET | `/api/v1/admin/users` | Admin | List users |
| GET | `/api/v1/admin/users/:id` | Admin | User detail |
| PATCH | `/api/v1/admin/users/:id` | Admin | Edit user |
| DELETE | `/api/v1/admin/users/:id` | Super | Deactivate user |
| GET | `/api/v1/admin/audit-logs` | Admin | View audit trail |

### Contact
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/contact` | No | Submit contact form |
| GET | `/api/v1/contact` | Admin | List submissions |
