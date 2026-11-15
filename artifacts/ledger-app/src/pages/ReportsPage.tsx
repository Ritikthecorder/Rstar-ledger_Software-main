import { useState } from "react";
import { useAllTransactions, useCustomerOutstandingBalances } from "@/hooks/useTransactions";
import { useSettingsStore } from "@/store/settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, TrendingUp, TrendingDown, Activity, CalendarRange } from "lucide-react";
import { formatCurrency, exportToCSV, exportCustomerBalancesToCSV } from "@/lib/export";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#22c55e", "#ef4444", "#3b82f6", "#f59e0b"];

export default function ReportsPage() {
  const settings = useSettingsStore((s) => s.settings);
  const currency = settings?.currency ?? "INR";

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: allTransactions, isLoading: txLoading } = useAllTransactions();
  const { data: balances, isLoading: balancesLoading } = useCustomerOutstandingBalances();

  const filtered = (allTransactions ?? []).filter((t) => t.date >= startDate && t.date <= endDate);

  const totalCredit = filtered.filter((t) => t.type === "credit").reduce((s, t) => s + Number(t.amount), 0);
  const totalDebit = filtered.filter((t) => t.type === "debit").reduce((s, t) => s + Number(t.amount), 0);
  const netFlow = totalCredit - totalDebit;

  const dailyData: Record<string, { credit: number; debit: number }> = {};
  filtered.forEach((t) => {
    if (!dailyData[t.date]) dailyData[t.date] = { credit: 0, debit: 0 };
    if (t.type === "credit") dailyData[t.date].credit += Number(t.amount);
    else dailyData[t.date].debit += Number(t.amount);
  });

  const chartData = Object.entries(dailyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  const modeData = ["cash", "upi", "bank", "card"].map((mode) => ({
    name: mode.toUpperCase(),
    value: filtered.filter((t) => t.payment_mode === mode).reduce((s, t) => s + Number(t.amount), 0),
  })).filter((d) => d.value > 0);

  const topCustomers = [...(balances ?? [])]
    .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
    .slice(0, 5);

  const summaryStats = [
    {
      label: "Total Credit",
      sublabel: "Money received",
      value: formatCurrency(totalCredit, currency),
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-900/20",
      icon: TrendingUp,
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      label: "Total Debit",
      sublabel: "Money paid out",
      value: formatCurrency(totalDebit, currency),
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-900/20",
      icon: TrendingDown,
      iconColor: "text-red-500 dark:text-red-400",
    },
    {
      label: "Net Cash Flow",
      sublabel: netFlow >= 0 ? "You are in profit" : "You are in loss",
      value: formatCurrency(netFlow, currency),
      color: netFlow >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
      bg: netFlow >= 0 ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20",
      icon: Activity,
      iconColor: netFlow >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Financial analysis and insights</p>
        </div>
      </div>

      {/* Date Range + Exports */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Date Range</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
            <div className="grid grid-cols-2 gap-4 flex-1">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">From</Label>
                <Input type="date" className="h-9" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">To</Label>
                <Input type="date" className="h-9" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => exportToCSV(filtered as any, "report")}>
                <Download className="h-4 w-4" />Transactions
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => exportCustomerBalancesToCSV(
                (balances ?? []).map((b) => ({ name: b.name, totalCredit: b.totalCredit, totalDebit: b.totalDebit, balance: b.balance }))
              )}>
                <Download className="h-4 w-4" />Balances
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Showing <strong>{filtered.length}</strong> transactions in selected period
          </p>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryStats.map((s) => (
          <Card key={s.label} className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.sublabel}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Daily Cash Flow</CardTitle>
            <p className="text-xs text-muted-foreground">Credit vs Debit over the selected period</p>
          </CardHeader>
          <CardContent className="pt-2">
            {txLoading ? <Skeleton className="h-56" /> : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-56 text-muted-foreground text-sm">No data for this period</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                  <Legend />
                  <Bar dataKey="credit" name="Credit" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="debit" name="Debit" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Payment Mode Breakdown</CardTitle>
            <p className="text-xs text-muted-foreground">How payments are being made</p>
          </CardHeader>
          <CardContent className="pt-2">
            {txLoading ? <Skeleton className="h-56" /> : modeData.length === 0 ? (
              <div className="flex items-center justify-center h-56 text-muted-foreground text-sm">No data for this period</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={modeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {modeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer Balances */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Top Customer Balances</CardTitle>
          <p className="text-xs text-muted-foreground">Sorted by outstanding amount</p>
        </CardHeader>
        <CardContent className="pt-0">
          {balancesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : topCustomers.length === 0 ? (
            <p className="text-muted-foreground text-center py-10 text-sm">No customer data yet</p>
          ) : (
            <div className="space-y-2">
              {topCustomers.map((c) => (
                <div key={c.id} className="flex items-center gap-4 rounded-xl border bg-muted/20 px-4 py-3">
                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Credit: {formatCurrency(c.totalCredit, currency)} &nbsp;·&nbsp; Debit: {formatCurrency(c.totalDebit, currency)}
                    </p>
                  </div>

                  {/* Balance */}
                  <div className="text-right shrink-0">
                    <p className={`font-bold text-sm ${c.balance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {formatCurrency(c.balance, currency)}
                    </p>
                  </div>

                  {/* Status */}
                  <Badge
                    variant={c.balance > 0 ? "default" : c.balance < 0 ? "destructive" : "secondary"}
                    className="shrink-0 text-xs"
                  >
                    {c.balance > 0 ? "Receivable" : c.balance < 0 ? "Payable" : "Clear"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
