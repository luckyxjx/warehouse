# Store Inventory

Retail inventory management platform organized as two separate applications:

- `backend/` - Express, TypeScript, PostgreSQL, Prisma REST API
- `frontend/` - Next.js frontend app

## Assessment Scope

This submission completes Tier 1, adds Tier 2 order fulfillment, and includes a partial Tier 3 delivery quote engine.

- Sign up and sign in are implemented end to end.
- Passwords are hashed with bcrypt and only `passwordHash` is stored.
- JWT bearer auth protects product, inventory, sales, dashboard, purchase, and report APIs.
- Product CRUD covers SKU, name, quantity, category, and low-stock threshold.
- Dashboard flags products where stock is below the low-stock threshold.
- Client and server validation are both implemented with Zod-backed forms and API validators.
- Orders can request multiple SKUs and record fulfilled/backordered quantities.
- Order fulfillment uses atomic compare-and-decrement stock updates to avoid overselling under concurrent requests.
- Order history records each request, fulfillment status, item quantities, and backordered quantities.
- Delivery quote calculation supports pincode-derived zones, volumetric weight, simple vehicle capacity splitting, and cheapest-option selection.

Self-service signup creates an admin account so a new evaluator can immediately access the product CRUD workflow required by Tier 1. The seeded employee account is retained for the separate store/PWA view.

## Backend

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Backend health check:

```bash
curl http://localhost:3000/health
```

Default seeded accounts:

- Admin: `admin@example.com` / `admin123`
- Store operator: `store@example.com` / `store123`

## Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Frontend runs on `http://localhost:3000` by default if the port is free. If the backend also uses port `3000`, set `PORT=3001` or another available port in `backend/.env`, then update `NEXT_PUBLIC_API_URL` in `frontend/.env.local`.

## Production Notes

- Set a strong `JWT_SECRET` of at least 32 characters.
- Set `DATABASE_URL` to the production PostgreSQL database.
- Set `NEXT_PUBLIC_API_URL` to the deployed backend `/api` URL.
- Set `FRONTEND_URL` to the deployed frontend URL so backend CORS allows the app.
- Use `CORS_ORIGINS` for additional comma-separated origins such as Vercel preview deployments.

## Deployment

Recommended deployment:

- Frontend: Vercel
- Backend: Railway
- Database: Railway PostgreSQL

### Railway Backend

Create a Railway project with a PostgreSQL service and a backend service pointed at `backend/`.

Backend service settings:

```text
Root Directory: backend
Build Command: npm run build
Start Command: npm run start:railway
```

Railway backend environment variables:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=replace-with-a-real-random-secret-at-least-32-characters
JWT_EXPIRES_IN=1d
FRONTEND_URL=https://your-vercel-app.vercel.app
CORS_ORIGINS=
```

After deployment, verify:

```bash
curl https://your-railway-backend.up.railway.app/health
```

### Vercel Frontend

Import the repo into Vercel and point the project at `frontend/`.

Vercel settings:

```text
Root Directory: frontend
Build Command: npm run build
Install Command: npm install
```

Vercel environment variable:

```env
NEXT_PUBLIC_API_URL=https://your-railway-backend.up.railway.app/api
```

Redeploy after setting `NEXT_PUBLIC_API_URL`, because public Next.js env vars are included at build time.

### Production Smoke Test

1. Open the Vercel URL.
2. Sign up with a new account.
3. Confirm redirect to `/dashboard`.
4. Add, edit, and delete a product from `/products`.
5. Create a partial fulfillment order from `/orders`.
6. Calculate a delivery quote from `/routing`.
7. Refresh the page and confirm the logged-in state persists.
8. Logout and confirm protected routes redirect to login.

## Tier 2 Notes

The Orders page is available from the dashboard navigation. It accepts requested quantities above current stock so partial fulfillment and backorders can be tested directly.

The fulfillment service retries stock updates when another request changes the same product stock between read and write. Each successful decrement writes an inventory log with the `ORDER_FULFILLMENT` action.

## Partial Tier 3 Notes

The Routing page is available from the dashboard navigation. It uses fixed in-code rate and vehicle rules instead of database-managed warehouse/rate configuration.

Implemented:

- Local/regional/national zone selection from 6 digit pincodes
- Volumetric weight calculation using `length * width * height / 5000`
- Billable weight as the greater of actual and volumetric weight
- Bike, mini van, and small truck options with capacity limits
- Multi-vehicle splitting when billable weight exceeds one vehicle's capacity
- Cheapest-option selection with a short justification

Intentionally left out:

- Admin-managed warehouse records
- Persistent zone-rate matrix tables
- Real map routing, distance APIs, or carrier integrations
- Advanced optimization across multiple warehouses

## Not Included

Full production-grade Tier 3 routing is not completed in this version.
