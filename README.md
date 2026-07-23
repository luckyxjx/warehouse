# warehouse

stock management tool i built for a retail client. handles inventory, order fulfillment, and daily WhatsApp summaries.

- `backend/` — Express + Prisma + PostgreSQL
- `frontend/` — Next.js

## running locally

**backend**

```bash
cd backend
cp .env.example .env   # fill in DATABASE_URL and JWT_SECRET
npm install
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

```bash
curl http://localhost:3000/health
```

**frontend**

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

If backend and frontend both try to grab port 3000, set `PORT=3001` in `backend/.env` and update `NEXT_PUBLIC_API_URL` in `frontend/.env.local`.

## seeded accounts

| role | email | password |
|---|---|---|
| admin | lucky.admin@stockforge.io | LuckydaAdmin@123 |
| operator | toney.ops@stockforge.io | Warehouse@123 |
| operator | labubu.floor@stockforge.io | Operator@123 |

## deploying

I'm running this on Vercel (frontend + backend as services) with Supabase for the database.

**important:** Vercel is serverless, so use the Supabase connection pooler URL (port `6543`, transaction mode) for `DATABASE_URL`, not the direct connection. Add a separate `DIRECT_URL` pointing to port `5432` for migrations.

```env
# Vercel backend env vars
NODE_ENV=production
DATABASE_URL=postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres
JWT_SECRET=something-long-and-random
JWT_EXPIRES_IN=1d
FRONTEND_URL=https://your-app.vercel.app
```

```env
# Vercel frontend env vars
NEXT_PUBLIC_API_URL=https://your-app.vercel.app/api
```

After updating env vars, redeploy — Next.js bakes `NEXT_PUBLIC_*` at build time.

## what's in here

- auth (JWT, bcrypt, role-based — admin vs operator views)
- product CRUD with SKU, category, stock thresholds
- order fulfillment with partial fill + backorder tracking
- inventory logs on every stock movement
- monthly reports with PDF upload
- delivery quote engine (zone + volumetric weight + vehicle selection)
- daily WhatsApp summary via Twilio
