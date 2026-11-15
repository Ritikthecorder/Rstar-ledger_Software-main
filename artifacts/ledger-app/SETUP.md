# LedgerPro — Setup Guide

---

## Run Locally in VS Code

### Step 1 — Get the code
Download or clone this project to your computer.

### Step 2 — Open the app folder
Open VS Code, then open the terminal inside VS Code and run:
```
cd artifacts/ledger-app
```

### Step 3 — Create your environment file
```
cp .env.example .env
```
Open the newly created `.env` file and fill in your two Supabase values:
```
VITE_SUPABASE_URL=https://sdoetkjdbgaunxdjhoxr.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-from-supabase-dashboard
```
You can find these in your Supabase dashboard under **Project Settings → API**.

### Step 4 — Install dependencies
```
npm install
```
(or `pnpm install` if you have pnpm installed)

### Step 5 — Start the app
```
npm run dev
```
Open your browser at **http://localhost:5173** — the app will be running.

---

## Deploy to Vercel

### Step 1 — Push to GitHub
Push this project to a GitHub repository (public or private).

### Step 2 — Import on Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New → Project**
3. Select your GitHub repository and click **Import**

### Step 3 — Set the Root Directory
On the "Configure Project" screen:
- Click **Edit** next to Root Directory
- Set it to: `artifacts/ledger-app`
- Click **Continue**

### Step 4 — Add Environment Variables
Still on the same screen, scroll down to **Environment Variables** and add:

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://sdoetkjdbgaunxdjhoxr.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | your anon key from Supabase |

### Step 5 — Deploy
Click **Deploy**. Vercel will build and publish the app automatically.

Your live URL will look like: `https://ledgerpro-yourname.vercel.app`

> The PWA install prompt ("Add to Home Screen") will work immediately on this HTTPS URL.

---

## After Any Code Change

- **VS Code**: The dev server auto-reloads — no action needed.
- **Vercel**: Push to GitHub → Vercel redeploys automatically.
