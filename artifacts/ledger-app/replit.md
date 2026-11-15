
## Backup, Restore & Sync (May 2026)

Added a full Backup & Sync system accessible from the sidebar under "Backup & Sync" (`/backup`).

### Features built

**Export (download your data)**
- JSON full backup — customers + transactions in a restorable format
- Two CSV files — transactions.csv + customers.csv (Google Sheets compatible)
- Excel workbook (.xlsx) — two sheets: Transactions + Customers

**Restore from file**
- Drag-and-drop or file picker for `.json` LedgerPro backup files
- Shows preview: customer count, transaction count, export date before restoring
- Restore is additive (never overwrites existing records); re-maps customer IDs safely

**Google Drive**
- Browser-based OAuth via Google Identity Services (no backend needed)
- Uploads/updates `ledgerpro-backup.json` in user's Drive
- One-click restore from Drive
- Requires user to set up a Google Cloud OAuth 2.0 Client ID (free); setup instructions shown in-app
- Client ID stored in localStorage (no secrets in Supabase)

**Local device backup**
- Stores all customers + transactions in localStorage as a safety net
- "Save to this device now" button + "Restore from this device" if cache exists
- Shows last saved timestamp and record counts

**Cross-device sync (Realtime)**
- `useRealtimeSync` hook subscribes to Supabase `postgres_changes` for `transactions` and `customers` tables
- Any change on one device auto-invalidates TanStack Query cache on all other open sessions
- "Refresh all data" button for manual force-sync
- Explains in plain language how cross-device sync works

### Key files added/modified
- `src/lib/local-cache.ts` — localStorage cache read/write/clear
- `src/lib/google-drive.ts` — GIS OAuth + Drive REST API (upload, list, download)
- `src/lib/backup-utils.ts` — fetchAllData, buildBackupPayload, downloadJSON/CSV/Excel, parseBackupFile, restoreFromBackup
- `src/hooks/useRealtimeSync.ts` — Supabase Realtime channel subscription
- `src/pages/BackupPage.tsx` — full UI (5 sections: export, restore, Google Drive, local cache, sync)
- `src/App.tsx` — added `/backup` route + `useRealtimeSync` in AuthGate
- `src/components/AppLayout.tsx` — added "Backup & Sync" to footer nav
