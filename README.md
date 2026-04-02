# Kunji - Personal Finance Dashboard

> Kunji is a modern, self-hosted personal finance dashboard that helps users manage accounts, budgets, transactions, and insights with a clean, mobile-friendly Next.js UI.

## 🧩 Project Scope

- Multi-page finance app with authentication (sign in/sign up)
- Dashboard with account summaries, budget progress, and transaction feed
- Transaction creation with receipt scanning support
- Account detail page with paginated transaction table + charts
- Seed data path and actions for populating test data
- Inngest event orchestration for async automation (email, reports)
- Prisma ORM + SQLite/PostgreSQL backend

## 🚀 Features

- Auth flow (sign-in / sign-up UI under `app/(auth)`)
- Dashboard overview at `app/(main)/dashboard`
- Account management + transaction details at `app/(main)/account/[id]`
- Create transaction UI at `app/(main)/transaction/create`
- Category definitions and budget thresholds
- Real-time data mutations with database actions in `actions/*.js`
- Receipt image scanning in `components/transaction-form.jsx` and `transaction/_components/recipt-scanner.jsx`
- Server-side seeding via `app/api/seed/route.js` and CLI hooks

## 📁 Project Structure

- `app/` - Next.js App Router pages and layouts
  - `(auth)` - sign-in/sign-up routes
  - `(main)` - main app routes (dashboard, account, transaction)
  - `api/` - backend API routes (seed, inngest)
  - `lib/schema.js` - validation schema for forms
- `actions/` - server action handlers (CRUD, dashboard aggregation)
- `components/` - shared UI components and primitives
- `components/ui/` - design system controls (button, table, drawer, etc.)
- `data/` - static category and landing details
- `emails/` - email template for notification or report
- `lib/prisma.js` - Prisma client setup
- `prisma/schema.prisma` - data model for users/accounts/transactions/budgets

## 🧭 Architecture & Flow

1. User lands on auth routes and logs in / registers.
2. Authenticated user is redirected to dashboard (`app/(main)/dashboard`).
3. Dashboard fetches aggregated stats via `actions/dashboard.js`.
4. User can drill into accounts under `app/(main)/account/[id]`.
5. Creating transactions calls `actions/transaction.js` and updates the DB.
6. Inngest route (`app/api/inngest/route.js`) can process background events (e.g., email reports).
7. `app/api/seed/route.js` seeds sample data locally.

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|------|------------|---------|
| Frontend | Next.js 14+ App Router | Routing, SSR, React UI |
| API | Next.js server actions + API routes | CRUD and async event handling |
| Database ORM | Prisma | Type-safe DB access |
| DB | SQLite (default) / PostgreSQL | persist data |
| Styling | CSS + Tailwind-like components | UI styles |
| State | Server actions + hooks | data flow |
| Email/Event | Inngest | background jobs and email automation |

## ⚙️ Setup

```bash
cd kunji
npm install
npm run dev
```

- Open `http://localhost:3000`
- Seed data via `http://localhost:3000/api/seed` (if route exists)

## 🧪 Testing & Validation

- There are no dedicated test files yet, but quality checks are done via component-level logic and Prisma migrations.
- Add unit tests with Jest / React Testing Library as needed.

## 🛡️ Prisma Setup

1. Create `.env` with `DATABASE_URL` (SQLite or PostgreSQL).
2. `npx prisma migrate dev --name init`
3. `npx prisma db seed` (if configured)

## 📦 Deployment

- Build: `npm run build`
- Start: `npm run start`
- Recommended host: Vercel, Render, Railway, or any Node host

## 💡 Notes

- Keep `app/(main)` and `app/(auth)` route groups stable for layout isolation.
- `actions` folder includes business logic for budget calculation and transaction analytics.
- Extend categories in `data/categories.js` and use in transaction forms.

## 📚 Contributing

1. Fork repository
2. Create new branch feature/
3. Implement and test
4. Submit PR with a short description
 
