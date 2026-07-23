# warehouse

Stock management tool — built as part of the Forus Electric take-home assessment.

**Live:** https://warehouse-eight-beta.vercel.app

Covers Tier 1 (auth + product CRUD + dashboard), Tier 2 (concurrent order fulfillment), and a partial Tier 3 (delivery quote engine).

- `backend/` — Express + Prisma + PostgreSQL (Supabase)
- `frontend/` — Next.js (deployed as a Vercel service alongside the backend)

---

## running locally

**backend**

```bash
cd backend
cp .env.example .env   # fill in DATABASE_URL and JWT_SECRET at minimum
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

If backend and frontend both grab port 3000, set `PORT=3001` in `backend/.env` and update `NEXT_PUBLIC_API_URL` in `frontend/.env.local`.

## seeded accounts

| role | email | password |
|---|---|---|
| admin | lucky.admin@stockforge.io | LuckydaAdmin@123 |
| operator | toney.ops@stockforge.io | Warehouse@123 |
| operator | labubu.floor@stockforge.io | Operator@123 |

Admin sees the full dashboard. Operators get a simpler store view.

---

## deploying (Vercel + Supabase)

Both services are in one Vercel project via `vercel.json`. API calls to `/api/*` get rewritten to the backend service; everything else goes to the frontend.

Vercel runs serverless, so direct Postgres connections (port 5432) don't work reliably. Use Supabase's connection pooler in transaction mode (port 6543) for `DATABASE_URL`. Keep a `DIRECT_URL` pointing at port 5432 — Prisma uses that for migrations only.

```env
# backend
NODE_ENV=production
DATABASE_URL=postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres
JWT_SECRET=<at least 32 chars>
JWT_EXPIRES_IN=1d
FRONTEND_URL=https://your-app.vercel.app
```

```env
# frontend
NEXT_PUBLIC_API_URL=https://your-app.vercel.app/api
```

Redeploy after changing env vars — Next.js bakes `NEXT_PUBLIC_*` at build time.

---

## what I completed

**Tier 1**
- Signup and signin, end to end. Passwords hashed with bcrypt, only the hash stored.
- JWT auth with protected routes — unauthenticated requests bounce to login.
- Auth state persists on refresh (localStorage + `/me` revalidation). Expired tokens auto-clear.
- Product CRUD: SKU, name, category, stock, low-stock threshold. Validation on both client and server (Zod).
- Dashboard flags anything below its threshold.
- Role-based views — admin gets full management UI, employee gets a read-oriented operator view.

**Tier 2**
- Orders can request multiple SKUs at once.
- Stock deduction is handled with a compare-and-retry loop — if another request changes a product's stock between the read and the write, the operation retries rather than overwriting. No overselling.
- Partial fulfillment: fulfills what's available, marks the rest as backordered. Quantities tracked per line item.
- Every stock movement writes an inventory log with action type, previous stock, and new stock.

**Tier 3 (partial)**
- Pincode-based zone classification (local / regional / national).
- Volumetric weight calc (`l × w × h / 5000`), billable weight = max(actual, volumetric).
- Three vehicle types (bike, mini van, small truck) with capacity limits.
- Splits across multiple vehicles when weight exceeds a single vehicle's capacity.
- Returns cheapest viable option with a one-line justification.

What's not there: admin-managed warehouse records, a persistent zone-rate matrix, real carrier APIs. The rates and vehicle rules are hard-coded.

---

## assumptions

- Self-service signup creates an admin account. The brief requires that the app be accessible to an evaluator immediately, so I didn't lock signup behind an invite flow.
- Partial fulfillment records the backordered quantity but doesn't auto-retry when stock is replenished — that would need a background job or webhook.
- The delivery quote engine treats each order as a single shipment from one warehouse. Multi-warehouse routing is out of scope.
- Twilio WhatsApp daily summary is wired up but requires real Twilio credentials — it won't fire without them.

## what I'd do differently with more time

- Add a proper test suite — at minimum unit tests for the fulfillment logic and the quote engine, since those are the two places where bugs would actually cost money.
- Replace the hard-coded rate table with DB-managed warehouse/zone/rate records so ops staff can update pricing without a deploy.
- The inventory log is write-only right now. A proper audit trail UI would make it useful.
- Refresh token rotation instead of a fixed expiry JWT — better UX for long sessions.
- The frontend data-fetching is all client-side. Moving some of it to server components would reduce waterfall requests on initial load.
