# LedgerPro — Ledger Management Application

## Overview

Full-stack ledger management web app using Supabase as the backend (no custom Express backend for the main app).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **Frontend**: React + Vite + TypeScript (`artifacts/ledger-app`)
- **Styling**: Tailwind CSS + ShadCN UI
- **State management**: Zustand
- **Charts**: Recharts
- **Backend/DB/Auth**: Supabase (PostgreSQL + Auth)
- **Exports**: jsPDF + jspdf-autotable + xlsx
- **API server**: Express 5 (health check only, in `artifacts/api-server`)

## Supabase Setup

Environment variables needed:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key

### Required SQL (run in Supabase SQL Editor)

```sql
CREATE TABLE customers (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, name TEXT NOT NULL, phone TEXT, email TEXT, address TEXT, opening_balance NUMERIC DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE transactions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE, type TEXT NOT NULL CHECK (type IN ('credit','debit')), amount NUMERIC NOT NULL CHECK (amount > 0), description TEXT, payment_mode TEXT CHECK (payment_mode IN ('cash','upi','bank','card')), reference_id TEXT, date DATE NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), attachment_url TEXT);
CREATE TABLE settings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE, business_name TEXT DEFAULT '', currency TEXT DEFAULT 'INR', theme TEXT DEFAULT 'system' CHECK (theme IN ('light','dark','system')));
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own customers" ON customers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own settings" ON settings FOR ALL USING (auth.uid() = user_id);
```

## Key Commands

- `pnpm --filter @workspace/ledger-app run dev` — run frontend locally
- `pnpm --filter @workspace/api-server run dev` — run API server

## App Structure

```
artifacts/ledger-app/src/
  lib/
    supabase.ts         — Supabase client
    export.ts           — PDF/CSV export utilities
  types/
    database.ts         — TypeScript types for all tables
  store/
    auth.ts             — Auth state (Zustand)
    settings.ts         — Settings state (Zustand + localStorage)
  hooks/
    useAuth.ts          — Auth hook (session management)
    useCustomers.ts     — Customer CRUD hooks
    useTransactions.ts  — Transaction CRUD + stats hooks
    useSettings.ts      — Settings hooks
  components/
    ThemeProvider.tsx   — Dark/light/system theme
    AppLayout.tsx       — Sidebar layout
  pages/
    LoginPage.tsx       — Auth (email + Google OAuth)
    DashboardPage.tsx   — Overview + charts
    EntryPage.tsx       — Quick entry book (date/invoice/particular/credit/debit) + print
    CustomersPage.tsx   — Customer list + CRUD
    CustomerDetailPage.tsx — Customer ledger + transactions
    TransactionsPage.tsx — Global transaction list + filters
    LedgerPage.tsx      — Global ledger summary
    ReportsPage.tsx     — Reports + exports
    SettingsPage.tsx    — Business settings + theme
```

## Features

- Email/password and Google OAuth login
- Dashboard with balance stats and monthly charts
- **Entry Book** — fast data entry (date, invoice no., particular, credit, debit) with print-ready ledger including closing balance summary
- Customer management with full ledger view and running balance
- Transaction management with pagination and filters
- Global ledger with outstanding balances
- Reports with daily/monthly charts and payment mode breakdown
- PDF and Excel/CSV export
- Dark/light/system theme toggle
- Responsive sidebar layout (mobile + desktop)
