import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useCustomer } from "@/hooks/useCustomers";
import { useAllTransactions, useCustomerBalance, useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from "@/hooks/useTransactions";
import { useSettingsStore } from "@/store/settings";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Pencil, Trash2, Download, Printer, Share2, Copy, ExternalLink } from "lucide-react";
import { formatCurrency, exportLedgerToPDF } from "@/lib/export";
import { createPortalLink, compressWatermark, type PortalPayload } from "@/lib/portal-utils";
import { useBusinessProfileStore } from "@/store/businessProfile";
import { useAuthStore } from "@/store/auth";
import type { Transaction } from "@/types/database";

interface TransactionFormData {
  type: "credit" | "debit";
  amount: number;
  description: string;
  payment_mode: "cash" | "upi" | "bank" | "card";
  reference_id: string;
  date: string;
}

function TransactionForm({
  defaultValues,
  onSubmit,
  loading,
}: {
  defaultValues?: Partial<TransactionFormData>;
  onSubmit: (data: TransactionFormData) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<TransactionFormData>({
    type: defaultValues?.type ?? "credit",
    amount: defaultValues?.amount ?? 0,
    description: defaultValues?.description ?? "",
    payment_mode: defaultValues?.payment_mode ?? "cash",
    reference_id: defaultValues?.reference_id ?? "",
    date: defaultValues?.date ?? new Date().toISOString().split("T")[0],
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Type *</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "credit" | "debit" })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="credit">Credit</SelectItem>
              <SelectItem value="debit">Debit</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Amount *</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Date *</Label>
          <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
        </div>
        <div className="space-y-1">
          <Label>Payment Mode</Label>
          <Select value={form.payment_mode} onValueChange={(v) => setForm({ ...form, payment_mode: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="bank">Bank Transfer</SelectItem>
              <SelectItem value="card">Card</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label>Description</Label>
        <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label>Reference ID</Label>
        <Input value={form.reference_id} onChange={(e) => setForm({ ...form, reference_id: e.target.value })} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
      </DialogFooter>
    </form>
  );
}

export default function CustomerDetailPage() {
  const [, params] = useRoute("/customers/:id");
  const id = params?.id ?? "";
  const { toast } = useToast();
  const settings = useSettingsStore((s) => s.settings);
  const currency = settings?.currency ?? "INR";

  const { watermarkDataUrl, description: bizDescription } = useBusinessProfileStore();
  const user = useAuthStore((s) => s.user);

  const { data: customer, isLoading: customerLoading } = useCustomer(id);
  const { data: transactionData, isLoading: txLoading } = useAllTransactions(id);
  const { data: balanceData } = useCustomerBalance(id);
  const transactions = transactionData ?? [];

  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const [showCreate, setShowCreate] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showPortal, setShowPortal] = useState(false);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async (data: TransactionFormData) => {
    if (!customer) return;
    try {
      await createTransaction.mutateAsync({ ...data, customer_id: id });
      toast({ title: "Transaction added" });
      setShowCreate(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleUpdate = async (data: TransactionFormData) => {
    if (!editingTx) return;
    try {
      await updateTransaction.mutateAsync({ id: editingTx.id, ...data });
      toast({ title: "Transaction updated" });
      setEditingTx(null);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteTransaction.mutateAsync(deletingId);
      toast({ title: "Transaction deleted" });
      setDeletingId(null);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleExportPDF = () => {
    if (!customer) return;
    exportLedgerToPDF(customer, transactions, customer.opening_balance ?? 0, currency);
  };

  const handlePrint = () => window.print();

  const handleSharePortal = async () => {
    if (!customer || !user) return;
    let wmCompressed: string | undefined;
    if (watermarkDataUrl) {
      try { wmCompressed = await compressWatermark(watermarkDataUrl); } catch { wmCompressed = undefined; }
    }
    const payload: PortalPayload = {
      v: 1,
      biz: settings?.business_name ?? "LedgerPro",
      ...(bizDescription ? { desc: bizDescription } : {}),
      cur: currency,
      exp: Date.now() + 48 * 60 * 60 * 1000,
      ...(wmCompressed ? { wm: wmCompressed } : {}),
      c: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        opening_balance: customer.opening_balance ?? 0,
      },
      tx: [...transactions].reverse().map((t) => ({
        date: t.date,
        type: t.type,
        amount: Number(t.amount),
        description: t.description,
        payment_mode: t.payment_mode,
        reference_id: t.reference_id,
      })),
    };
    try {
      const url = await createPortalLink(customer.id, user.id, payload);
      setPortalUrl(url);
      setShowPortal(true);
      setCopied(false);
    } catch (e: any) {
      toast({ title: "Could not generate link", description: e.message, variant: "destructive" });
    }
  };

  const handleCopyLink = () => {
    if (!portalUrl) return;
    navigator.clipboard.writeText(portalUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (customerLoading) return <div className="space-y-4"><Skeleton className="h-24" /><Skeleton className="h-96" /></div>;
  if (!customer) return <div>Customer not found</div>;

  const totalCredit = transactions.filter((t) => t.type === "credit").reduce((s, t) => s + Number(t.amount), 0);
  const totalDebit = transactions.filter((t) => t.type === "debit").reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/customers">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <p className="text-muted-foreground text-sm">
            {customer.phone && <span className="mr-3">{customer.phone}</span>}
            {customer.email && <span>{customer.email}</span>}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleSharePortal}>
            <Share2 className="h-4 w-4 mr-2" />Share Portal
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />Add Transaction
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Opening Balance", value: formatCurrency(customer.opening_balance ?? 0, currency), color: "text-foreground" },
          { label: "Total Credit", value: formatCurrency(totalCredit, currency), color: "text-green-600" },
          { label: "Total Debit", value: formatCurrency(totalDebit, currency), color: "text-red-600" },
          { label: "Current Balance", value: formatCurrency(balanceData?.balance ?? 0, currency), color: "text-primary font-bold" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={`text-lg font-semibold mt-1 ${item.color}`}>{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Transaction History</CardTitle>
          <Badge variant="secondary">{transactions.length} transactions</Badge>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <div className="space-y-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No transactions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Date</th>
                    <th className="pb-3 pr-4 font-medium">Description</th>
                    <th className="pb-3 pr-4 font-medium">Mode</th>
                    <th className="pb-3 pr-4 font-medium text-right">Credit</th>
                    <th className="pb-3 pr-4 font-medium text-right">Debit</th>
                    <th className="pb-3 pr-4 font-medium text-right">Balance</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let runBal = customer.opening_balance ?? 0;
                    return transactions.map((t) => {
                      if (t.type === "credit") runBal += Number(t.amount);
                      else runBal -= Number(t.amount);
                      const bal = runBal;
                      return (
                        <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-3 pr-4 whitespace-nowrap">{t.date}</td>
                          <td className="py-3 pr-4 text-muted-foreground max-w-[180px] truncate">{t.description ?? "-"}</td>
                          <td className="py-3 pr-4">
                            <Badge variant="outline" className="text-xs capitalize">{t.payment_mode ?? "-"}</Badge>
                          </td>
                          <td className="py-3 pr-4 text-right text-green-600">
                            {t.type === "credit" ? formatCurrency(Number(t.amount), currency) : ""}
                          </td>
                          <td className="py-3 pr-4 text-right text-red-600">
                            {t.type === "debit" ? formatCurrency(Number(t.amount), currency) : ""}
                          </td>
                          <td className={`py-3 pr-4 text-right font-medium ${bal >= 0 ? "text-green-700" : "text-red-700"}`}>
                            {formatCurrency(bal, currency)}
                          </td>
                          <td className="py-3">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingTx(t)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeletingId(t.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Transaction</DialogTitle></DialogHeader>
          <TransactionForm onSubmit={handleCreate} loading={createTransaction.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingTx} onOpenChange={() => setEditingTx(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Transaction</DialogTitle></DialogHeader>
          {editingTx && (
            <TransactionForm
              defaultValues={{
                type: editingTx.type,
                amount: editingTx.amount,
                description: editingTx.description ?? "",
                payment_mode: editingTx.payment_mode ?? "cash",
                reference_id: editingTx.reference_id ?? "",
                date: editingTx.date,
              }}
              onSubmit={handleUpdate}
              loading={updateTransaction.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Portal Modal */}
      <Dialog open={showPortal} onOpenChange={setShowPortal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Share2 className="h-4 w-4 text-primary" />
              Customer Portal Link
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Link preview card */}
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 dark:bg-slate-800/40 dark:border-slate-700 p-4 space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Shareable link for</p>
              <p className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight">{customer.name}</p>
              <p className="text-xs text-slate-400 truncate font-mono">
                {portalUrl ? `${window.location.origin}/portal/…` : ""}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                  ● Active — expires in 48 hours
                </span>
              </div>
            </div>

            {/* Copy button — primary action */}
            <button
              onClick={handleCopyLink}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                copied
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                  : "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-white shadow-lg shadow-slate-800/20"
              }`}
            >
              {copied ? (
                <><span className="text-base">✓</span> Copied to clipboard!</>
              ) : (
                <><Copy className="h-4 w-4" /> Copy Link</>
              )}
            </button>

            {/* Secondary actions */}
            <div className="flex gap-2">
              <button
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Hi ${customer.name}, here is your account statement: ${portalUrl}`)}`, "_blank")}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-base">💬</span> WhatsApp
              </button>
              <button
                onClick={() => window.open(portalUrl!, "_blank")}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Preview
              </button>
            </div>

            <p className="text-xs text-slate-400 text-center">
              Read-only · No login needed · Works on any device
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
