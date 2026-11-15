# LedgerPro

Full-stack ledger management app. Frontend lives in `artifacts/ledger-app` (React + Vite + TypeScript + Tailwind + ShadCN). Supabase is the backend (Auth + Postgres). State managed with Zustand and TanStack Query.

## Workflow

- `Ledger App` runs `PORT=5000 pnpm --filter @workspace/ledger-app run dev` on port 5000 (webview).

## Required secrets

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## App routes

- `/` Dashboard
- `/entry` Entry Book
- `/customers`, `/customers/:id`
- `/transactions`
- `/ledger`
- `/reports`
- `/reminders` — Payment reminders (auto-detects overdue debit entries; one-tap WhatsApp send)
- `/settings`
- `/about`

## Payment Reminders feature

- Auto-detects every debit entry older than `reminderDays` (default 15) where the customer still has a positive outstanding balance.
- Lists them on `/reminders` with one-tap WhatsApp send (uses `wa.me/<phone>` link + customizable message template).
- A `cooldownDays` window (default 7) prevents nagging the same entry twice.
- Sent log + thresholds + message template are persisted client-side via Zustand (`store/reminders.ts`, key `ledger-reminders`).
- Dashboard shows a red banner when anything is overdue; sidebar shows a count badge.
- For real automatic background SMS/WhatsApp sending, plug a gateway (Twilio, MSG91, Fast2SMS) into `lib/reminders.ts` → `sendSmsReminder()` and trigger it from a Supabase Edge Function or backend cron. The current implementation is the next-best thing without a gateway.

## Key files added/modified for reminders

- `src/store/reminders.ts` — Zustand store (threshold, cooldown, template, sent log)
- `src/lib/reminders.ts` — overdue logic, message builder, WhatsApp link builder, SMS placeholder
- `src/hooks/useOverdueReminders.ts` — TanStack Query hook
- `src/pages/RemindersPage.tsx` — list + actions UI
- `src/components/AppLayout.tsx` — nav item with badge
- `src/pages/DashboardPage.tsx` — overdue banner
- `src/pages/SettingsPage.tsx` — reminder settings card
- `src/App.tsx` — `/reminders` route

## People First UI Redesign (April 2026)

Graduated the "People First — Soft Glass" mockup from the canvas into the live app. Touches the entire app, not just the dashboard.

**Aesthetic:** soft pastel mesh background (peach → lavender → mint), glass-morphism cards (white 55% + 20px blur), Plus Jakarta Sans typography, slate-800 primary, rounded-2xl/3xl, conversational copy.

**Key files modified:**
- `index.html` — swapped Inter → Plus Jakarta Sans
- `src/index.css` — new color tokens (cream bg, slate primary, soft pastel chart colors), `--radius: 1rem`, body mesh-gradient background (light + dark variants), added `.glass-card` and `.glass-pill` component utilities
- `src/components/ui/card.tsx` — Card now uses `.glass-card` so every card across the app is glassy
- `src/components/AppLayout.tsx` — sidebar is a glass card with rounded-[2rem], gradient avatar logo, white-on-active nav buttons, "Connect" section, mobile glass header
- `src/pages/DashboardPage.tsx` — full rewrite: conversational greeting, gradient hero balance, glass pills for credit/debit, friendly overdue alert with avatar stack, recharts AreaChart with green/rose gradients, "Who you saw recently" feed with deterministic colored avatar circles (helpers `colorFor`, `initialsOf`, `relativeDate`)

All other pages (Customers, Transactions, Ledger, Reports, Reminders, Settings, About, Login) inherit the new theme automatically through the updated CSS tokens and glassified Card.

The mockup files at `artifacts/mockup-sandbox/src/components/mockups/ledger-dashboards/` are kept for reference.
