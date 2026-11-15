import { useCustomerOutstandingBalances } from "@/hooks/useTransactions";
import { useAllTransactions } from "@/hooks/useTransactions";
import { useSettingsStore } from "@/store/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Printer } from "lucide-react";
import { formatCurrency, exportGlobalLedgerToPDF, exportCustomerBalancesToCSV, printElement } from "@/lib/export";
import { Link } from "wouter";

export default function LedgerPage() {
  const settings = useSettingsStore((s) => s.settings);
  const currency = settings?.currency ?? "INR";
  const businessName = settings?.business_name || "LedgerPro";

  const { data: balances, isLoading } = useCustomerOutstandingBalances();
  const { data: allTransactions } = useAllTransactions();
  const transactions = allTransactions ?? [];

  const sorted = [...(balances ?? [])].sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
  const totalCredit = sorted.reduce((s, r) => s + r.totalCredit, 0);
  const totalDebit = sorted.reduce((s, r) => s + r.totalDebit, 0);
  const totalBalance = sorted.reduce((s, r) => s + r.balance, 0);

  const handleExportPDF = () => {
    exportGlobalLedgerToPDF(
      sorted.map((r) => ({ customer: r.name, credit: r.totalCredit, debit: r.totalDebit, balance: r.balance })),
      currency
    );
  };

  const handleExportCSV = () => {
    exportCustomerBalancesToCSV(
      sorted.map((r) => ({ name: r.name, totalCredit: r.totalCredit, totalDebit: r.totalDebit, balance: r.balance }))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Global Ledger</h1>
          <p className="text-muted-foreground text-sm mt-1">Outstanding balances across all customers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => printElement("print-ledger", "Global Ledger")}>
            <Printer className="h-4 w-4 mr-2" />Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Total Credit</p>
            <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(totalCredit, currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Total Debit</p>
            <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(totalDebit, currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Net Balance</p>
            <p className={`text-xl font-bold mt-1 ${totalBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(totalBalance, currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Customer Ledger Summary</CardTitle>
          <Badge variant="secondary">{sorted.length} customers</Badge>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : sorted.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">No customer data</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Customer</th>
                    <th className="pb-3 pr-4 font-medium text-right">Total Credit</th>
                    <th className="pb-3 pr-4 font-medium text-right">Total Debit</th>
                    <th className="pb-3 pr-4 font-medium text-right">Balance</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-3 pr-4">
                        <Link href={`/customers/${r.id}`} className="font-medium hover:text-primary transition-colors">
                          {r.name}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-right text-green-600">{formatCurrency(r.totalCredit, currency)}</td>
                      <td className="py-3 pr-4 text-right text-red-600">{formatCurrency(r.totalDebit, currency)}</td>
                      <td className={`py-3 pr-4 text-right font-semibold ${r.balance >= 0 ? "text-green-700" : "text-red-700"}`}>
                        {formatCurrency(r.balance, currency)}
                      </td>
                      <td className="py-3">
                        <Badge
                          className="text-xs"
                          variant={r.balance > 0 ? "default" : r.balance < 0 ? "destructive" : "secondary"}
                        >
                          {r.balance > 0 ? "Receivable" : r.balance < 0 ? "Payable" : "Clear"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-bold bg-muted/30">
                    <td className="py-3 pr-4">Total</td>
                    <td className="py-3 pr-4 text-right text-green-600">{formatCurrency(totalCredit, currency)}</td>
                    <td className="py-3 pr-4 text-right text-red-600">{formatCurrency(totalDebit, currency)}</td>
                    <td className={`py-3 pr-4 text-right ${totalBalance >= 0 ? "text-green-700" : "text-red-700"}`}>
                      {formatCurrency(totalBalance, currency)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="print-section">
        <CardHeader>
          <CardTitle className="text-base">Recent Transactions (Global)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 pr-4 font-medium">Customer</th>
                  <th className="pb-3 pr-4 font-medium">Description</th>
                  <th className="pb-3 pr-4 font-medium">Mode</th>
                  <th className="pb-3 pr-4 font-medium text-right">Amount</th>
                  <th className="pb-3 font-medium">Type</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 20).map((t) => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-2 pr-4 whitespace-nowrap">{t.date}</td>
                    <td className="py-2 pr-4">{(t as any).customers?.name ?? "-"}</td>
                    <td className="py-2 pr-4 text-muted-foreground max-w-[160px] truncate">{t.description ?? "-"}</td>
                    <td className="py-2 pr-4 capitalize text-muted-foreground text-xs">{t.payment_mode ?? "-"}</td>
                    <td className={`py-2 pr-4 text-right font-medium ${t.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                      {t.type === "credit" ? "+" : "-"}{formatCurrency(Number(t.amount), currency)}
                    </td>
                    <td className="py-2">
                      <Badge variant={t.type === "credit" ? "default" : "destructive"} className="text-xs capitalize">
                        {t.type}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Printable Ledger (hidden on screen, printed via printElement) ── */}
      <div id="print-ledger" className="print-only">
        <PrintLedger
          businessName={businessName}
          currency={currency}
          sorted={sorted}
          totalCredit={totalCredit}
          totalDebit={totalDebit}
          totalBalance={totalBalance}
          transactions={transactions}
        />
      </div>
    </div>
  );
}

function PrintLedger({
  businessName,
  currency,
  sorted,
  totalCredit,
  totalDebit,
  totalBalance,
  transactions,
}: {
  businessName: string;
  currency: string;
  sorted: any[];
  totalCredit: number;
  totalDebit: number;
  totalBalance: number;
  transactions: any[];
}) {
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  return (
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: "13px", color: "#111", padding: "32px" }}>
      <div style={{ textAlign: "center", marginBottom: "24px", borderBottom: "2px solid #1d4ed8", paddingBottom: "16px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "4px" }}>{businessName}</h1>
        <p style={{ color: "#888", fontSize: "11px" }}>Global Ledger Report</p>
        <p style={{ color: "#555", fontSize: "11px", marginTop: "4px" }}>Date: {today}</p>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        {[
          { label: "Total Credit", value: totalCredit, color: "#16a34a" },
          { label: "Total Debit", value: totalDebit, color: "#dc2626" },
          { label: "Net Balance", value: totalBalance, color: totalBalance >= 0 ? "#16a34a" : "#dc2626" },
        ].map((s) => (
          <div key={s.label} style={{ flex: 1, padding: "12px", border: "1px solid #e2e8f0", borderRadius: "6px", textAlign: "center" }}>
            <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px" }}>{s.label}</p>
            <p style={{ fontSize: "16px", fontWeight: "700", color: s.color }}>{formatCurrency(s.value, currency)}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px", color: "#1e3a8a" }}>Customer Ledger Summary</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
        <thead>
          <tr style={{ backgroundColor: "#1d4ed8", color: "white" }}>
            <th style={{ padding: "8px 10px", textAlign: "left", fontSize: "12px" }}>Customer</th>
            <th style={{ padding: "8px 10px", textAlign: "right", fontSize: "12px" }}>Total Credit</th>
            <th style={{ padding: "8px 10px", textAlign: "right", fontSize: "12px" }}>Total Debit</th>
            <th style={{ padding: "8px 10px", textAlign: "right", fontSize: "12px" }}>Balance</th>
            <th style={{ padding: "8px 10px", textAlign: "center", fontSize: "12px" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, idx) => (
            <tr key={r.id} style={{ backgroundColor: idx % 2 === 0 ? "#f8fafc" : "#fff" }}>
              <td style={{ padding: "7px 10px", borderBottom: "1px solid #e2e8f0", fontWeight: "500" }}>{r.name}</td>
              <td style={{ padding: "7px 10px", borderBottom: "1px solid #e2e8f0", textAlign: "right", color: "#16a34a" }}>{formatCurrency(r.totalCredit, currency)}</td>
              <td style={{ padding: "7px 10px", borderBottom: "1px solid #e2e8f0", textAlign: "right", color: "#dc2626" }}>{formatCurrency(r.totalDebit, currency)}</td>
              <td style={{ padding: "7px 10px", borderBottom: "1px solid #e2e8f0", textAlign: "right", fontWeight: "600", color: r.balance >= 0 ? "#16a34a" : "#dc2626" }}>{formatCurrency(r.balance, currency)}</td>
              <td style={{ padding: "7px 10px", borderBottom: "1px solid #e2e8f0", textAlign: "center", fontSize: "11px" }}>
                {r.balance > 0 ? "Receivable" : r.balance < 0 ? "Payable" : "Clear"}
              </td>
            </tr>
          ))}
          <tr style={{ backgroundColor: "#f1f5f9", fontWeight: "700" }}>
            <td style={{ padding: "9px 10px", borderTop: "2px solid #1d4ed8" }}>Total</td>
            <td style={{ padding: "9px 10px", textAlign: "right", borderTop: "2px solid #1d4ed8", color: "#16a34a" }}>{formatCurrency(totalCredit, currency)}</td>
            <td style={{ padding: "9px 10px", textAlign: "right", borderTop: "2px solid #1d4ed8", color: "#dc2626" }}>{formatCurrency(totalDebit, currency)}</td>
            <td style={{ padding: "9px 10px", textAlign: "right", borderTop: "2px solid #1d4ed8", color: totalBalance >= 0 ? "#16a34a" : "#dc2626" }}>{formatCurrency(totalBalance, currency)}</td>
            <td style={{ padding: "9px 10px", borderTop: "2px solid #1d4ed8" }}></td>
          </tr>
        </tbody>
      </table>

      <h2 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px", color: "#1e3a8a" }}>Recent Transactions</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#1d4ed8", color: "white" }}>
            <th style={{ padding: "8px 10px", textAlign: "left", fontSize: "12px" }}>Date</th>
            <th style={{ padding: "8px 10px", textAlign: "left", fontSize: "12px" }}>Customer</th>
            <th style={{ padding: "8px 10px", textAlign: "left", fontSize: "12px" }}>Description</th>
            <th style={{ padding: "8px 10px", textAlign: "left", fontSize: "12px" }}>Mode</th>
            <th style={{ padding: "8px 10px", textAlign: "right", fontSize: "12px" }}>Amount</th>
            <th style={{ padding: "8px 10px", textAlign: "center", fontSize: "12px" }}>Type</th>
          </tr>
        </thead>
        <tbody>
          {transactions.slice(0, 20).map((t, idx) => (
            <tr key={t.id} style={{ backgroundColor: idx % 2 === 0 ? "#f8fafc" : "#fff" }}>
              <td style={{ padding: "7px 10px", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>{t.date}</td>
              <td style={{ padding: "7px 10px", borderBottom: "1px solid #e2e8f0" }}>{(t as any).customers?.name ?? "-"}</td>
              <td style={{ padding: "7px 10px", borderBottom: "1px solid #e2e8f0", color: "#6b7280" }}>{t.description ?? "-"}</td>
              <td style={{ padding: "7px 10px", borderBottom: "1px solid #e2e8f0", textTransform: "capitalize", color: "#6b7280", fontSize: "11px" }}>{t.payment_mode ?? "-"}</td>
              <td style={{ padding: "7px 10px", borderBottom: "1px solid #e2e8f0", textAlign: "right", fontWeight: "500", color: t.type === "credit" ? "#16a34a" : "#dc2626" }}>
                {t.type === "credit" ? "+" : "-"}{formatCurrency(Number(t.amount), currency)}
              </td>
              <td style={{ padding: "7px 10px", borderBottom: "1px solid #e2e8f0", textAlign: "center", fontSize: "11px", textTransform: "capitalize" }}>{t.type}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "32px", borderTop: "1px solid #e2e8f0", paddingTop: "12px", display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#9ca3af" }}>
        <span>Generated by {businessName}</span>
        <span>Printed on {today}</span>
      </div>
    </div>
  );
}
