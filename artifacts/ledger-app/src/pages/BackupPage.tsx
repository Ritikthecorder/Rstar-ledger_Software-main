import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { useSettingsStore } from "@/store/settings";
import { useToast } from "@/hooks/use-toast";
import {
  fetchAllData,
  buildBackupPayload,
  downloadJSON,
  downloadCSV,
  downloadExcel,
  parseBackupFile,
  restoreFromBackup,
  removeDuplicates,
  type BackupData,
} from "@/lib/backup-utils";
import {
  saveToLocalCache,
  loadFromLocalCache,
  getLocalCacheMeta,
  type CacheMeta,
} from "@/lib/local-cache";
import {
  Download,
  Upload,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileJson,
  FileSpreadsheet,
  FileText,
  Wifi,
} from "lucide-react";

function Section({ title, subtitle, icon, children }: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-[1.75rem] p-6 space-y-5">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center shrink-0 shadow-sm">
          {icon}
        </div>
        <div>
          <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">{title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function ActionButton({
  onClick, loading, disabled, children, variant = "default",
}: {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: "default" | "primary" | "danger";
}) {
  const base = "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    default: "glass-pill text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-white/10",
    primary: "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-white shadow-lg shadow-slate-800/20",
    danger: "glass-pill text-rose-600 dark:text-rose-400 hover:bg-rose-50/60 dark:hover:bg-rose-950/40",
  };
  return (
    <button onClick={onClick} disabled={disabled || loading} className={`${base} ${variants[variant]}`}>
      {loading && <RefreshCw size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${color}`}>
      {children}
    </span>
  );
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function BackupPage() {
  const user = useAuthStore((s) => s.user);
  const settings = useSettingsStore((s) => s.settings);
  const qc = useQueryClient();
  const { toast } = useToast();

  const [exporting, setExporting] = useState<string | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<BackupData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<{
    customersInserted: number;
    transactionsInserted: number;
    errors: string[];
  } | null>(null);

  const [cacheMeta, setCacheMeta] = useState<CacheMeta | null>(() => getLocalCacheMeta());
  const [cacheSaving, setCacheSaving] = useState(false);
  const [cacheRestoring, setCacheRestoring] = useState(false);
  const [deduplicating, setDeduplicating] = useState(false);

  const [syncing, setSyncing] = useState(false);

  const dropRef = useRef<HTMLDivElement>(null);

  const requireUser = () => {
    if (!user) { toast({ title: "Not signed in", variant: "destructive" }); return false; }
    return true;
  };

  const getPayload = async () => {
    if (!user) throw new Error("Not signed in");
    const { customers, transactions } = await fetchAllData(user.id);
    return {
      customers,
      transactions,
      payload: buildBackupPayload(
        customers as any,
        transactions as any,
        settings?.business_name ?? "LedgerPro"
      ),
    };
  };

  const handleExportJSON = async () => {
    if (!requireUser()) return;
    setExporting("json");
    try {
      const { payload } = await getPayload();
      downloadJSON(payload);
      toast({ title: "Backup downloaded", description: "Your full backup JSON is ready." });
    } catch (e: any) {
      toast({ title: "Export failed", description: e.message, variant: "destructive" });
    } finally { setExporting(null); }
  };

  const handleExportCSV = async () => {
    if (!requireUser()) return;
    setExporting("csv");
    try {
      const { customers, transactions } = await getPayload();
      downloadCSV(customers as any, transactions as any);
      toast({ title: "CSV files downloaded", description: "Two files: transactions + customers." });
    } catch (e: any) {
      toast({ title: "Export failed", description: e.message, variant: "destructive" });
    } finally { setExporting(null); }
  };

  const handleExportExcel = async () => {
    if (!requireUser()) return;
    setExporting("excel");
    try {
      const { customers, transactions } = await getPayload();
      downloadExcel(customers as any, transactions as any);
      toast({ title: "Excel file downloaded", description: "Two sheets: Transactions + Customers." });
    } catch (e: any) {
      toast({ title: "Export failed", description: e.message, variant: "destructive" });
    } finally { setExporting(null); }
  };

  const handleFileChange = async (file: File) => {
    setImportFile(file);
    setImportPreview(null);
    setImportError(null);
    setRestoreResult(null);
    try {
      const data = await parseBackupFile(file);
      setImportPreview(data);
    } catch (e: any) {
      setImportError(e.message);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  }, []);

  const handleRestore = async () => {
    if (!importPreview || !user) return;
    setRestoring(true);
    setRestoreResult(null);
    try {
      const result = await restoreFromBackup(importPreview, user.id);
      setRestoreResult(result);
      qc.invalidateQueries();
      toast({
        title: `Restored ${result.customersInserted} customers, ${result.transactionsInserted} transactions`,
        description: result.errors.length
          ? `${result.errors.length} items skipped.`
          : "All data restored successfully.",
      });
    } catch (e: any) {
      toast({ title: "Restore failed", description: e.message, variant: "destructive" });
    } finally { setRestoring(false); }
  };

  const handleSaveCache = async () => {
    if (!requireUser()) return;
    setCacheSaving(true);
    try {
      const { customers, transactions } = await getPayload();
      const ok = saveToLocalCache(customers, transactions);
      if (ok) {
        setCacheMeta(getLocalCacheMeta());
        toast({
          title: "Saved to this device",
          description: `${customers.length} customers, ${transactions.length} transactions.`,
        });
      } else {
        toast({ title: "Save failed", description: "Your device storage may be full.", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally { setCacheSaving(false); }
  };

  const handleCacheRestore = async () => {
    if (!requireUser()) return;
    const { customers, transactions, meta } = loadFromLocalCache();
    if (!meta) { toast({ title: "No local backup found", variant: "destructive" }); return; }
    setCacheRestoring(true);
    try {
      const fakePayload: BackupData = {
        version: 1,
        exportedAt: meta.savedAt,
        businessName: settings?.business_name ?? "LedgerPro",
        customers: customers as any,
        transactions: transactions as any,
      };
      const result = await restoreFromBackup(fakePayload, user!.id);
      qc.invalidateQueries();
      toast({
        title: "Restored from device backup",
        description: `${result.customersInserted} customers, ${result.transactionsInserted} transactions restored.`,
      });
    } catch (e: any) {
      toast({ title: "Restore failed", description: e.message, variant: "destructive" });
    } finally { setCacheRestoring(false); }
  };

  const handleDeduplicate = async () => {
    if (!requireUser()) return;
    setDeduplicating(true);
    try {
      const result = await removeDuplicates(user!.id);
      qc.invalidateQueries();
      if (result.customersRemoved === 0 && result.transactionsRemoved === 0) {
        toast({ title: "No duplicates found", description: "Your data is already clean." });
      } else {
        toast({
          title: "Duplicates removed",
          description: `${result.customersRemoved} duplicate customer${result.customersRemoved !== 1 ? "s" : ""} and ${result.transactionsRemoved} duplicate transaction${result.transactionsRemoved !== 1 ? "s" : ""} removed.`,
        });
      }
    } catch (e: any) {
      toast({ title: "Cleanup failed", description: e.message, variant: "destructive" });
    } finally { setDeduplicating(false); }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await qc.invalidateQueries();
      await qc.refetchQueries({ type: "active" });
      toast({ title: "Synced", description: "All data refreshed from the database." });
    } finally { setSyncing(false); }
  };

  return (
    <div className="space-y-6">
      <div className="px-2">
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Backup & Sync</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
          Your data lives in the database and syncs across every device automatically. Export a copy anytime, or restore from a backup.
        </p>
      </div>

      {/* ── Export ── */}
      <Section
        title="Export your data"
        subtitle="Download a snapshot of everything — customers and all transactions."
        icon={<Download size={20} className="text-emerald-600" />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: "json",
              label: "Full backup (JSON)",
              sub: "Customers + transactions. Use this to restore later.",
              icon: <FileJson size={20} className="text-indigo-500" />,
              color: "bg-indigo-50 dark:bg-indigo-950/40",
              onClick: handleExportJSON,
            },
            {
              id: "csv",
              label: "Two CSV files",
              sub: "Spreadsheet-friendly. Open in Google Sheets.",
              icon: <FileText size={20} className="text-teal-500" />,
              color: "bg-teal-50 dark:bg-teal-950/40",
              onClick: handleExportCSV,
            },
            {
              id: "excel",
              label: "Excel workbook",
              sub: "Two sheets: transactions + customers.",
              icon: <FileSpreadsheet size={20} className="text-green-600" />,
              color: "bg-green-50 dark:bg-green-950/40",
              onClick: handleExportExcel,
            },
          ].map((item) => (
            <button
              key={item.id}
              onClick={item.onClick}
              disabled={exporting !== null}
              className="text-left p-4 rounded-2xl border border-white/60 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/5 transition-all disabled:opacity-50"
            >
              <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center mb-3`}>
                {item.icon}
              </div>
              <p className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                {item.label}
                {exporting === item.id && <RefreshCw size={12} className="animate-spin text-slate-400" />}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.sub}</p>
            </button>
          ))}
        </div>
      </Section>

      {/* ── Restore from file ── */}
      <Section
        title="Restore from a file"
        subtitle="Upload a backup JSON created by LedgerPro. Data will be added without overwriting existing records."
        icon={<Upload size={20} className="text-rose-500" />}
      >
        <div
          ref={dropRef}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-white/70 dark:border-white/20 rounded-2xl p-8 text-center hover:bg-white/30 dark:hover:bg-white/5 transition-colors"
        >
          {!importFile ? (
            <>
              <Upload size={28} className="mx-auto mb-3 text-slate-400" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                Drag a backup file here, or click to browse
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Accepts: .json (LedgerPro backup)</p>
              <label className="mt-4 inline-block glass-pill px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
                Browse file
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileChange(f); }}
                />
              </label>
            </>
          ) : (
            <div className="space-y-3">
              <p className="font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2">
                <FileJson size={18} className="text-indigo-500" /> {importFile.name}
              </p>
              {importError && (
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-sm justify-center">
                  <AlertCircle size={16} /> {importError}
                </div>
              )}
              {importPreview && (
                <div className="flex flex-wrap justify-center gap-3">
                  <Tag color="bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                    <CheckCircle2 size={12} /> {importPreview.customers.length} customers
                  </Tag>
                  <Tag color="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <CheckCircle2 size={12} /> {importPreview.transactions.length} transactions
                  </Tag>
                  <Tag color="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    Exported {formatDate(importPreview.exportedAt)}
                  </Tag>
                </div>
              )}
              <div className="flex justify-center gap-3 pt-1">
                {importPreview && (
                  <ActionButton onClick={handleRestore} loading={restoring} variant="primary">
                    Restore this backup
                  </ActionButton>
                )}
                <ActionButton
                  onClick={() => {
                    setImportFile(null);
                    setImportPreview(null);
                    setImportError(null);
                    setRestoreResult(null);
                  }}
                  variant="default"
                >
                  Clear
                </ActionButton>
              </div>
              {restoreResult && (
                <div
                  className={`text-sm rounded-xl px-4 py-3 mt-2 ${
                    restoreResult.errors.length
                      ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
                      : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                  }`}
                >
                  <p className="font-semibold">
                    {restoreResult.customersInserted} customers and {restoreResult.transactionsInserted} transactions restored.
                  </p>
                  {restoreResult.errors.length > 0 && (
                    <p className="mt-1 text-xs">
                      {restoreResult.errors.length} items skipped:{" "}
                      {restoreResult.errors.slice(0, 2).join("; ")}
                      {restoreResult.errors.length > 2 ? "…" : ""}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Section>

      {/* ── Local device backup ── */}
      <Section
        title="Local device backup"
        subtitle="Save a copy on this browser. Works as a safety net if you accidentally delete data."
        icon={<HardDrive size={20} className="text-orange-500" />}
      >
        <div className="space-y-4">
          {cacheMeta ? (
            <div className="flex flex-wrap gap-3 items-center">
              <Tag color="bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">
                <CheckCircle2 size={12} /> {cacheMeta.customerCount} customers · {cacheMeta.transactionCount} transactions
              </Tag>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Saved {formatDate(cacheMeta.savedAt)}
              </span>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No local backup yet on this browser.</p>
          )}
          <div className="flex flex-wrap gap-3">
            <ActionButton onClick={handleSaveCache} loading={cacheSaving} variant="primary">
              <HardDrive size={14} /> Save to this device now
            </ActionButton>
            {cacheMeta && (
              <ActionButton onClick={handleCacheRestore} loading={cacheRestoring}>
                <Upload size={14} /> Restore from this device
              </ActionButton>
            )}
            <ActionButton onClick={handleDeduplicate} loading={deduplicating} variant="danger">
              <AlertCircle size={14} /> Remove duplicates
            </ActionButton>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Stored in your browser's local storage — tied to this device and browser, not shared across devices.
            {" "}Use <strong>Remove duplicates</strong> if repeated restores created extra entries.
          </p>
        </div>
      </Section>

      {/* ── Cross-device sync ── */}
      <Section
        title="Cross-device sync"
        subtitle="Your data is already syncing. The database is the single source of truth — log in from any device to see everything."
        icon={<Wifi size={20} className="text-emerald-500" />}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Tag color="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 size={12} /> Realtime sync active
            </Tag>
            <Tag color="bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
              <CheckCircle2 size={12} /> Database connected
            </Tag>
          </div>
          <div className="bg-slate-50/60 dark:bg-slate-800/30 rounded-2xl p-4 text-sm text-slate-600 dark:text-slate-400 space-y-1.5">
            <p>
              ✅ <strong className="text-slate-800 dark:text-slate-200">Any device</strong> — log in with the same account on phone, tablet, or computer and your full ledger appears instantly.
            </p>
            <p>
              ✅ <strong className="text-slate-800 dark:text-slate-200">Real-time updates</strong> — if you add a transaction on one device, other open tabs update automatically with no refresh needed.
            </p>
            <p>
              ✅ <strong className="text-slate-800 dark:text-slate-200">Offline safe</strong> — use the local backup above to keep a device copy for emergencies.
            </p>
          </div>
          <ActionButton onClick={handleManualSync} loading={syncing}>
            <RefreshCw size={14} /> Refresh all data now
          </ActionButton>
        </div>
      </Section>
    </div>
  );
}
