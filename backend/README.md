# Warehouse Stock Manager Backend

Production-ready MVP backend for a warehouse stock and fulfillment management system.

## Stack

- Node.js, Express.js, TypeScript
- PostgreSQL, Prisma ORM
- JWT authentication
- Zod validation
- dotenv, nodemon

## Setup

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Update `DATABASE_URL` and `JWT_SECRET` in `.env`.

3. Install dependencies:

```bash
npm install
```

4. Run migrations and seed:

```bash
npm run prisma:migrate
npm run prisma:seed
```

5. Start development server:

```bash
npm run dev
```

## Scripts

- `npm run dev` - start Express with nodemon and tsx
- `npm run build` - compile TypeScript
- `npm start` - run compiled server
- `npm run prisma:generate` - generate Prisma client
- `npm run prisma:migrate` - run Prisma migrations
- `npm run prisma:seed` - seed admin user and sample products

## Default Seed User

- Email: `admin@example.com`
- Password: `admin123`
- Role: `ADMIN`

## Endpoints

- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/products`
- `GET /api/products?page=1&limit=20&search=&category=`
- `GET /api/products/:id`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `POST /api/inventory/add-stock`
- `POST /api/inventory/adjust-stock`
- `POST /api/sales`
- `GET /api/dashboard/overview`
- `GET /api/dashboard/top-products`
- `GET /api/dashboard/low-stock`
- `GET /api/reports/monthly?year=2026&month=6`
- `GET /api/reports/product-performance`

Protected routes require:

```http
Authorization: Bearer <token>
```
