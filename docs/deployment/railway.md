# Railway Deployment Guide

This repo is a monorepo with three deployable services:

- `web` — buyer/seller-facing Next.js app
- `admin` — admin Next.js app
- `api` — Express + Prisma API

Recommended Railway layout:

1. `onyx-api`
2. `onyx-web`
3. `onyx-admin`
4. `PostgreSQL`
5. optional persistent volume for API uploads if you are not using Cloudinary

## Service Setup

Create each Railway service from the same repo root. Do not change the source root to an individual app folder; the workspace packages are shared across apps.

### API service

- Build command: `pnpm railway:build:api`
- Start command: `pnpm railway:start:api`

Environment variables:

```env
NODE_ENV=production
PORT=${{PORT}}
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=replace-with-long-random-secret
CSRF_SECRET=replace-with-long-random-secret
APP_URL=https://your-web-domain
CORS_ORIGINS=https://your-web-domain,https://your-admin-domain

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

GOOGLE_CLIENT_ID=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Use one of the two media strategies below:
# Strategy A: Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Strategy B: Railway volume-backed local uploads
UPLOAD_DIR=/data/uploads
```

If you are not using Cloudinary, mount a Railway volume to the API service and set `UPLOAD_DIR=/data/uploads`.

### Web service

- Build command: `pnpm railway:build:web`
- Start command: `pnpm railway:start:web`

Environment variables:

```env
NODE_ENV=production
PORT=${{PORT}}
NEXTAUTH_SECRET=replace-with-long-random-secret
NEXTAUTH_URL=https://your-web-domain
NEXT_PUBLIC_API_URL=https://your-api-domain
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Admin service

- Build command: `pnpm railway:build:admin`
- Start command: `pnpm railway:start:admin`

Environment variables:

```env
NODE_ENV=production
PORT=${{PORT}}
NEXTAUTH_SECRET=replace-with-long-random-secret
NEXTAUTH_URL=https://your-admin-domain
NEXT_PUBLIC_API_URL=https://your-api-domain
```

## Database

After provisioning Railway PostgreSQL, run migrations:

```bash
pnpm railway:db:migrate
```

Seed only when you intentionally want demo/bootstrap data:

```bash
pnpm railway:db:seed
```

## Domains

Recommended domain split:

- `www.yourdomain.com` -> web
- `admin.yourdomain.com` -> admin
- `api.yourdomain.com` -> api

## Google Login

Google login is implemented for the `web` service only.

Set these Google OAuth redirect URLs:

- `http://localhost:3000/api/auth/callback/google`
- `https://your-web-domain/api/auth/callback/google`

Set these JavaScript origins:

- `http://localhost:3000`
- `https://your-web-domain`

The same `GOOGLE_CLIENT_ID` must be present in both `web` and `api`.

## Media Storage Recommendation

Best production setup:

- use Cloudinary for images/videos/documents
- keep the Railway volume only as a fallback

If you choose volume-backed uploads instead:

- upload data will live only on the API service volume
- backups are your responsibility
- scaling horizontally is harder

## Deployment Order

1. Create Railway PostgreSQL
2. Deploy API and set all API env vars
3. Run `pnpm railway:db:migrate`
4. Optionally run `pnpm railway:db:seed`
5. Deploy Web with `NEXT_PUBLIC_API_URL` pointing to the API domain
6. Deploy Admin with `NEXT_PUBLIC_API_URL` pointing to the API domain
7. Add custom domains
8. Update:
   - `NEXTAUTH_URL`
   - `APP_URL`
   - `CORS_ORIGINS`
   - Google OAuth allowed origins and redirect URLs
   - Razorpay callback/webhook config

## Smoke Checklist

- `GET /health` returns `200`
- web login works
- admin login works
- Google login works on web
- property image upload works
- payment plan creation works
- password reset email links use the production web URL
