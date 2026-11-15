import { Link } from "wouter";
import { useDashboardStats, useTransactions } from "@/hooks/useTransactions";
import { useOverdueReminders } from "@/hooks/useOverdueReminders";
import { useSettings } from "@/hooks/useSettings";
import { useSettingsStore } from "@/store/settings";
import { useAuthStore } from "@/store/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/export";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Plus,
  Users,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
} from "recharts";

const AVATAR_COLORS = [
  "bg-pink-200 text-pink-700",
  "bg-blue-200 text-blue-700",
  "bg-green-200 text-green-700",
  "bg-purple-200 text-purple-700",
  "bg-orange-200 text-orange-700",
  "bg-teal-200 text-teal-700",
  "bg-yellow-200 text-yellow-700",
  "bg-indigo-200 text-indigo-700",
  "bg-rose-200 text-rose-700",
  "bg-cyan-200 text-cyan-700",
];

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function relativeDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function DashboardPage() {
  useSettings();
  const settings = useSettingsStore((s) => s.settings);
  const userEmail = useAuthStore((s) => s.user?.email);
  const currency = settings?.currency ?? "INR";

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentData } = useTransactions({ page: 1, pageSize: 8 });
  const recentTransactions = recentData?.data ?? [];
  const { data: overdue } = useOverdueReminders();

  const overdueEntries = overdue ?? [];
  const overdueAmount = overdueEntries.reduce((s, e) => s + Number(e.transaction.amount), 0);
  const overduePending = overdueEntries.filter((e) => !e.alreadySent || !e.cooldownActive);

  const greetingName =
    settings?.business_name?.split(/\s+/)[0] ||
    userEmail?.split("@")[0] ||
    "friend";

  const overdueAvatars = overdueEntries
    .slice(0, 4)
    .map((e) => {
      const name = (e.transaction as any).customers?.name ?? "?";
      return { name, initial: initialsOf(name), color: colorFor(name) };
    });

  const chartData =
    stats?.chartData?.map((d) => {
      const [, m] = d.month.split("-");
      const monthName = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m) - 1];
      return { name: monthName, credit: d.credit, debit: d.debit };
    }) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6 px-2">
        <div>
          <h2 className="text-base lg:text-lg font-medium text-slate-500 dark:text-slate-400 mb-1">
            Welcome back, {greetingName} 👋
          </h2>
          {statsLoading ? (
            <Skeleton className="h-14 w-64" />
          ) : (
            <div className="text-4xl lg:text-[3.5rem] font-extrabold tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-br from-slate-800 to-slate-500 dark:from-slate-100 dark:to-slate-400">
              {formatCurrency(stats?.balance ?? 0, currency)}
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="glass-pill px-3 py-1 rounded-full inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
              <ArrowUpRight size={14} /> {formatCurrency(stats?.totalCredit ?? 0, currency)} owed to you
            </span>
            <span className="glass-pill px-3 py-1 rounded-full inline-flex items-center gap-1.5 text-rose-500 dark:text-rose-400 text-sm font-medium">
              <ArrowDownLeft size={14} /> {formatCurrency(stats?.totalDebit ?? 0, currency)} you owe
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-card px-4 py-3 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-300">
              {stats?.customerCount ?? 0}
            </div>
            <span className="text-sm font-semibold flex items-center gap-1.5">
              <Users size={14} className="text-slate-500" /> Active customers
            </span>
          </div>
          <Link href="/entry">
            <button className="bg-slate-800 hover:bg-slate-700 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white px-5 py-3.5 rounded-2xl font-bold shadow-xl shadow-slate-800/20 transition-all flex items-center gap-2">
              <Plus size={18} /> New Entry
            </button>
          </Link>
        </div>
      </header>

      {/* Friendly Overdue Alert */}
      {overdueEntries.length > 0 && (
        <Link href="/reminders">
          <div className="glass-card rounded-[1.75rem] p-6 relative overflow-hidden cursor-pointer hover:bg-white/65 dark:hover:bg-slate-800/65 transition-colors">
            <div className="absolute right-0 top-0 w-64 h-64 bg-rose-200/40 dark:bg-rose-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 relative z-10">
              <div>
                <h3 className="text-xl lg:text-2xl font-bold mb-1">
                  You're owed {formatCurrency(overdueAmount, currency)}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 font-medium text-sm">
                  From {overdueEntries.length} {overdueEntries.length === 1 ? "friend" : "friends"} ·{" "}
                  {overduePending.length > 0
                    ? `${overduePending.length} ready for a gentle nudge`
                    : "all caught up on reminders"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {overdueAvatars.length > 0 && (
                  <div className="flex -space-x-2">
                    {overdueAvatars.map((f, i) => (
                      <div
                        key={i}
                        className={`w-10 h-10 rounded-full border-2 border-white/80 dark:border-slate-700 flex items-center justify-center text-sm font-bold shadow-sm ${f.color}`}
                        title={f.name}
                      >
                        {f.initial}
                      </div>
                    ))}
                  </div>
                )}
                <button className="glass-pill px-5 py-2.5 rounded-xl font-bold text-rose-600 dark:text-rose-400 shadow-sm hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all text-sm whitespace-nowrap">
                  Send reminders
                </button>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Chart + Recent grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Chart */}
        <div className="glass-card rounded-[1.75rem] p-6 lg:col-span-3 flex flex-col min-h-[360px]">
          <div className="flex justify-between items-start mb-6 flex-wrap gap-2">
            <div>
              <h3 className="text-lg font-bold">Your year at a glance</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Money flowing in vs out
              </p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div> Money In
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                <div className="w-3 h-3 rounded-full bg-rose-400"></div> Money Out
              </div>
            </div>
          </div>

          <div className="flex-1 w-full min-h-[260px]">
            {statsLoading ? (
              <Skeleton className="h-full w-full" />
            ) : chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                No activity yet — your first transactions will appear here.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCredit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDebit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fb7185" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    dy={10}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      background: "rgba(255,255,255,0.95)",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    }}
                    formatter={(value: number) => formatCurrency(value, currency)}
                    cursor={{ stroke: "rgba(148, 163, 184, 0.2)", strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="credit"
                    stroke="#34d399"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorCredit)"
                  />
                  <Area
                    type="monotone"
                    dataKey="debit"
                    stroke="#fb7185"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorDebit)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent feed */}
        <div className="glass-card rounded-[1.75rem] p-6 lg:col-span-2 flex flex-col">
          <h3 className="text-lg font-bold">Who you saw recently</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-5">
            Latest {Math.min(recentTransactions.length, 8)} interactions
          </p>

          <div className="flex-1 space-y-3">
            {recentTransactions.length === 0 && (
              <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">
                No transactions yet
              </p>
            )}
            {recentTransactions.slice(0, 8).map((row) => {
              const t = row as any;
              const name = t.customers?.name ?? "Unknown";
              const color = colorFor(name);
              const initial = initialsOf(name);
              return (
                <Link key={t.id} href={`/customers/${t.customer_id ?? ""}`}>
                  <div className="group p-3 -mx-3 rounded-2xl hover:bg-white/50 dark:hover:bg-white/5 transition-all flex items-center justify-between cursor-pointer border border-transparent hover:border-white/60 dark:hover:border-white/10">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shadow-sm shrink-0 ${color}`}
                      >
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate">{name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {relativeDate(t.date)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <p
                        className={`font-bold ${
                          t.type === "credit"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {t.type === "credit" ? "+" : "-"}
                        {formatCurrency(Number(t.amount), currency)}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center justify-end gap-1 mt-0.5">
                        {t.type === "credit" ? "Received" : "Given"}
                        <ChevronRight
                          size={12}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {recentTransactions.length > 0 && (
            <Link href="/transactions">
              <button className="w-full mt-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 rounded-xl transition-colors">
                View all interactions
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
