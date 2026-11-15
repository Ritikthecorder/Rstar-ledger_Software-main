import { useState } from "react";
import { useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from "@/hooks/useTransactions";
import { useCustomers } from "@/hooks/useCustomers";
import { useSettingsStore } from "@/store/settings";
import { useAuthStore } from "@/store/auth";
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
import { Plus, Pencil, Trash2, Download, ChevronLeft, ChevronRight, ArrowUpCircle, ArrowDownCircle, SlidersHorizontal, X } from "lucide-react";
import { formatCurrency, exportToCSV } from "@/lib/export";
import type { Transaction } from "@/types/database";

interface TransactionFormData {
  customer_id: string;
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
  customers,
}: {
  defaultValues?: Partial<TransactionFormData>;
  onSubmit: (data: TransactionFormData) => void;
  loading: boolean;
  customers: { id: string; name: string }[];
}) {
  const [form, setForm] = useState<TransactionFormData>({
    customer_id: defaultValues?.customer_id ?? "",
    type: defaultValues?.type ?? "credit",
    amount: defaultValues?.amount ?? 0,
    description: defaultValues?.description ?? "",
    payment_mode: defaultValues?.payment_mode ?? "cash",
    reference_id: defaultValues?.reference_id ?? "",
    date: defaultValues?.date ?? new Date().toISOString().split("T")[0],
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-5">
      <div className="space-y-1.5">
        <Label>Customer <span className="text-destructive">*</span></Label>
        <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
          <SelectTrigger className="h-10"><SelectValue placeholder="Select customer" /></SelectTrigger>
          <SelectContent>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Type <span className="text-destructive">*</span></Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any })}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="credit">Credit (Money In)</SelectItem>
              <SelectItem value="debit">Debit (Money Out)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Amount <span className="text-destructive">*</span></Label>
          <Input
            type="number" step="0.01" min="0"
            className="h-10"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Date <span className="text-destructive">*</span></Label>
          <Input type="date" className="h-10" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>Payment Mode</Label>
          <Select value={form.payment_mode} onValueChange={(v) => setForm({ ...form, payment_mode: v as any })}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="bank">Bank Transfer</SelectItem>
              <SelectItem value="card">Card</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Input className="h-10" placeholder="What was this transaction for?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>

      <div className="space-y-1.5">
        <Label>Reference / Invoice No.</Label>
        <Input className="h-10" placeholder="e.g. INV-001" value={form.reference_id} onChange={(e) => setForm({ ...form, reference_id: e.target.value })} />
      </div>

      <DialogFooter>
        <Button type="submit" className="w-full" disabled={loading || !form.customer_id}>
          {loading ? "Saving..." : "Save Transaction"}
        </Button>
      </DialogFooter>
    </form>
  );
}

const modeColors: Record<string, string> = {
  cash: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  upi: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  bank: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  card: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export default function TransactionsPage() {
  const { toast } = useToast();
  const settings = useSettingsStore((s) => s.settings);
  const currency = settings?.currency ?? "INR";

  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<"" | "credit" | "debit">("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const PAGE_SIZE = 20;

  const { data: txData, isLoading } = useTransactions({
    page,
    pageSize: PAGE_SIZE,
    type: typeFilter || undefined,
    customerId: customerFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });
  const { data: customers } = useCustomers();
  const transactions = txData?.data ?? [];
  const totalCount = txData?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const [showCreate, setShowCreate] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const hasFilters = !!(typeFilter || customerFilter || startDate || endDate);

  const clearFilters = () => {
    setTypeFilter("");
    setCustomerFilter("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const handleCreate = async (data: TransactionFormData) => {
    try {
      await createTransaction.mutateAsync(data);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground text-sm mt-1">{totalCount} total records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToCSV(transactions as any)}>
            <Download className="h-4 w-4 mr-2" />Export
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />Add Transaction
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Filters</CardTitle>
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground" onClick={clearFilters}>
                <X className="h-3 w-3" />Clear all
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Transaction Type</Label>
              <Select value={typeFilter || "all"} onValueChange={(v) => { setTypeFilter(v === "all" ? "" : v as any); setPage(1); }}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="credit">Credit only</SelectItem>
                  <SelectItem value="debit">Debit only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Customer</Label>
              <Select value={customerFilter || "all"} onValueChange={(v) => { setCustomerFilter(v === "all" ? "" : v); setPage(1); }}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All customers" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All customers</SelectItem>
                  {(customers ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">From Date</Label>
              <Input type="date" className="h-9" value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">To Date</Label>
              <Input type="date" className="h-9" value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction list */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-muted-foreground text-sm">No transactions found</p>
              {hasFilters && (
                <Button variant="link" size="sm" className="mt-2" onClick={clearFilters}>Clear filters</Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {transactions.map((t) => {
                const isCredit = t.type === "credit";
                const customerName = (t as any).customers?.name ?? "-";
                return (
                  <div key={t.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                    {/* Icon */}
                    <div className={`shrink-0 rounded-full p-2 ${isCredit ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                      {isCredit
                        ? <ArrowUpCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        : <ArrowDownCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{customerName}</p>
                        {t.payment_mode && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${modeColors[t.payment_mode] ?? ""}`}>
                            {t.payment_mode.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {t.description || "No description"} {t.reference_id ? `· ${t.reference_id}` : ""}
                      </p>
                    </div>

                    {/* Date */}
                    <div className="shrink-0 text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">{t.date}</p>
                    </div>

                    {/* Amount */}
                    <div className="shrink-0 text-right min-w-[90px]">
                      <p className={`font-semibold text-sm ${isCredit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {isCredit ? "+" : "-"}{formatCurrency(Number(t.amount), currency)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setEditingTx(t)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeletingId(t.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} · {totalCount} records
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm onSubmit={handleCreate} loading={createTransaction.isPending} customers={customers ?? []} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingTx} onOpenChange={() => setEditingTx(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          {editingTx && (
            <TransactionForm
              defaultValues={{
                customer_id: editingTx.customer_id,
                type: editingTx.type,
                amount: editingTx.amount,
                description: editingTx.description ?? "",
                payment_mode: editingTx.payment_mode ?? "cash",
                reference_id: editingTx.reference_id ?? "",
                date: editingTx.date,
              }}
              onSubmit={handleUpdate}
              loading={updateTransaction.isPending}
              customers={customers ?? []}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
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
    </div>
  );
}
