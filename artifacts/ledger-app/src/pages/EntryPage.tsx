import { useState, useRef } from "react";
import { useCustomers, useCreateCustomer } from "@/hooks/useCustomers";
import { useAllTransactions, useCreateTransaction, useDeleteTransaction } from "@/hooks/useTransactions";
import { useSettingsStore } from "@/store/settings";
import { useBusinessProfileStore } from "@/store/businessProfile";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CalendarRange, Download, Plus, Printer, Trash2, UserPlus, ScanLine, Camera, Loader2, AlertCircle } from "lucide-react";
import { DialogDescription } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/export";
import { scanReceipt, type OcrResult } from "@/lib/ocr";

const emptyCustomerForm = () => ({
  name: "",
  phone: "",
  email: "",
  address: "",
  opening_balance: "",
});

interface EntryRow {
  date: string;
  invoice_number: string;
  particular: string;
  credit: string;
  debit: string;
}

const emptyRow = (): EntryRow => ({
  date: new Date().toISOString().split("T")[0],
  invoice_number: "",
  particular: "",
  credit: "",
  debit: "",
});

export default function EntryPage() {
  const { toast } = useToast();
  const settings = useSettingsStore((s) => s.settings);
  const currency = settings?.currency ?? "INR";
  const businessName = settings?.business_name || "LedgerPro";
  const { description: businessDescription, watermarkDataUrl, geminiApiKey } = useBusinessProfileStore();
  const { canWrite, canDelete } = usePermissions();

  const { data: customers } = useCustomers();
  const createCustomer = useCreateCustomer();
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [rows, setRows] = useState<EntryRow[]>([emptyRow()]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState(emptyCustomerForm());
  const [savingCustomer, setSavingCustomer] = useState(false);

  // Print / Export dialog state
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportAction, setExportAction] = useState<"print" | "export">("print");
  const [exportMode, setExportMode] = useState<"full" | "range">("full");
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const [printTxList, setPrintTxList] = useState<typeof txList>([]);

  // Receipt scan state
  const [showScan, setShowScan] = useState(false);
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState<OcrResult | null>(null);
  const [scanAmount, setScanAmount] = useState("");
  const [scanDescription, setScanDescription] = useState("");
  const [scanDate, setScanDate] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);

  const { data: savedTransactions, isLoading: txLoading } = useAllTransactions(selectedCustomer || undefined);
  const createTransaction = useCreateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const selectedCustomerData = (customers ?? []).find((c) => c.id === selectedCustomer);
  const openingBalance = Number(selectedCustomerData?.opening_balance ?? 0);

  const txList = savedTransactions ?? [];
  const totalCredit = txList.reduce((s, t) => s + (t.type === "credit" ? Number(t.amount) : 0), 0);
  const totalDebit = txList.reduce((s, t) => s + (t.type === "debit" ? Number(t.amount) : 0), 0);
  const closingBalance = openingBalance + totalCredit - totalDebit;

  const updateRow = (i: number, field: keyof EntryRow, value: string) => {
    setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!selectedCustomer) {
      toast({ title: "Select a customer first", variant: "destructive" });
      return;
    }
    const validRows = rows.filter((r) => r.particular && (r.credit || r.debit));
    if (validRows.length === 0) {
      toast({ title: "Enter at least one entry with a particular and amount", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      for (const row of validRows) {
        const isCredit = !!row.credit && Number(row.credit) > 0;
        const amount = isCredit ? Number(row.credit) : Number(row.debit);
        if (!amount || amount <= 0) continue;
        await createTransaction.mutateAsync({
          customer_id: selectedCustomer,
          type: isCredit ? "credit" : "debit",
          amount,
          description: row.particular,
          reference_id: row.invoice_number,
          date: row.date,
          payment_mode: null,
        });
      }
      toast({ title: `${validRows.length} entr${validRows.length === 1 ? "y" : "ies"} saved successfully` });
      setRows([emptyRow()]);
    } catch (e: any) {
      toast({ title: "Error saving entries", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteTransaction.mutateAsync(deletingId);
      toast({ title: "Entry deleted" });
      setDeletingId(null);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleSaveCustomer = async () => {
    if (!customerForm.name.trim()) {
      toast({ title: "Customer name is required", variant: "destructive" });
      return;
    }
    setSavingCustomer(true);
    try {
      const newCustomer = await createCustomer.mutateAsync({
        name: customerForm.name.trim(),
        phone: customerForm.phone.trim() || null,
        email: customerForm.email.trim() || null,
        address: customerForm.address.trim() || null,
        opening_balance: customerForm.opening_balance ? Number(customerForm.opening_balance) : 0,
      });
      toast({ title: `Customer "${newCustomer.name}" created` });
      setSelectedCustomer(newCustomer.id);
      setShowNewCustomer(false);
      setCustomerForm(emptyCustomerForm());
    } catch (e: any) {
      toast({ title: "Error creating customer", description: e.message, variant: "destructive" });
    }
    setSavingCustomer(false);
  };

  const openExportDialog = (action: "print" | "export") => {
    if (!selectedCustomer) {
      toast({ title: "Select a customer first", variant: "destructive" });
      return;
    }
    setExportAction(action);
    setExportMode("full");
    setExportFrom("");
    setExportTo("");
    setShowExportDialog(true);
  };

  const handleConfirmExport = () => {
    let filtered = txList;
    if (exportMode === "range" && exportFrom && exportTo) {
      const from = new Date(exportFrom);
      const to = new Date(exportTo);
      to.setHours(23, 59, 59, 999);
      filtered = txList.filter((t) => {
        const d = new Date(t.date);
        return d >= from && d <= to;
      });
    }
    setPrintTxList(filtered);
    setShowExportDialog(false);
    setTimeout(() => window.print(), 150);
  };

  return (
    <>
      {/* ── Print Styles ── */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-ledger, #print-ledger * { visibility: visible; }
          #print-ledger { position: absolute; top: 0; left: 0; width: 100%; padding: 24px; }
          .no-print { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div className="space-y-6">
        <div className="flex items-center justify-between no-print">
          <div>
            <h1 className="text-2xl font-bold">Entry Book</h1>
            <p className="text-muted-foreground text-sm mt-1">Record daily ledger entries</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => openExportDialog("print")}>
              <Printer className="h-4 w-4 mr-2" />Print Ledger
            </Button>
            <Button variant="outline" size="sm" onClick={() => openExportDialog("export")}>
              <Download className="h-4 w-4 mr-2" />Export PDF
            </Button>
            <Button size="sm" onClick={() => setShowNewCustomer(true)}>
              <UserPlus className="h-4 w-4 mr-2" />New Customer
            </Button>
          </div>
        </div>

        {/* Customer selector */}
        <Card className="no-print">
          <CardContent className="pt-5 pb-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Customer</Label>
              <p className="text-xs text-muted-foreground">Choose who this entry book is for</p>
              <Select value={selectedCustomer || "none"} onValueChange={(v) => setSelectedCustomer(v === "none" ? "" : v)}>
                <SelectTrigger className="h-10 max-w-md">
                  <SelectValue placeholder="Choose a customer..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Choose a customer...</SelectItem>
                  {(customers ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Entry input rows */}
        <Card className="no-print">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">New Entries</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Fill in each row and save all at once</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => { setShowScan(true); setScanFile(null); setScanPreview(null); setScanResult(null); setScanError(null); setScanAmount(""); setScanDescription(""); setScanDate(""); }} className="gap-2">
                  <ScanLine className="h-4 w-4" />Scan Receipt
                </Button>
                <Badge variant="secondary">{rows.length} {rows.length === 1 ? "row" : "rows"}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {rows.map((row, i) => (
              <div
                key={i}
                className="relative rounded-xl border bg-muted/30 p-4 space-y-3 transition-shadow hover:shadow-sm"
              >
                {/* Row number + delete */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Entry #{i + 1}
                  </span>
                  {rows.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => removeRow(i)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {/* Row 1: Date + Invoice */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Date</Label>
                    <Input
                      type="date"
                      value={row.date}
                      onChange={(e) => updateRow(i, "date", e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Invoice No.</Label>
                    <Input
                      placeholder="INV-001"
                      value={row.invoice_number}
                      onChange={(e) => updateRow(i, "invoice_number", e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>

                {/* Row 2: Particular */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Particular / Description</Label>
                  <Input
                    placeholder="e.g. Payment received, Goods sold..."
                    value={row.particular}
                    onChange={(e) => updateRow(i, "particular", e.target.value)}
                    className="h-9"
                  />
                </div>

                {/* Row 3: Credit + Debit */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-green-600 dark:text-green-400">Credit (Money In)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={row.credit}
                      onChange={(e) => updateRow(i, "credit", e.target.value)}
                      className="h-9 text-green-700 dark:text-green-400 font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-red-500 dark:text-red-400">Debit (Money Out)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={row.debit}
                      onChange={(e) => updateRow(i, "debit", e.target.value)}
                      className="h-9 text-red-600 dark:text-red-400 font-medium"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" onClick={addRow} className="gap-2">
                <Plus className="h-4 w-4" />Add Another Row
              </Button>
              {canWrite && (
                <Button onClick={handleSave} disabled={saving || !selectedCustomer} className="px-6">
                  {saving ? "Saving..." : "Save All Entries"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Saved ledger for selected customer */}
        {selectedCustomer && (
          <>
            {/* Screen view */}
            <Card className="no-print">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">
                  Ledger — {selectedCustomerData?.name}
                </CardTitle>
                <Badge variant="secondary">{txList.length} entries</Badge>
              </CardHeader>
              <CardContent>
                {txLoading ? (
                  <div className="space-y-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
                ) : txList.length === 0 ? (
                  <p className="text-muted-foreground text-center py-10">No entries saved yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-3 pr-4 font-medium">Date</th>
                          <th className="pb-3 pr-4 font-medium">Invoice No.</th>
                          <th className="pb-3 pr-4 font-medium">Particular</th>
                          <th className="pb-3 pr-4 font-medium text-right">Credit</th>
                          <th className="pb-3 pr-4 font-medium text-right">Debit</th>
                          <th className="pb-3 font-medium text-right">Balance</th>
                          <th className="pb-3 w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          let runBal = openingBalance;
                          return [
                            <tr key="opening" className="border-b bg-muted/20">
                              <td className="py-2 pr-4 text-muted-foreground text-xs" colSpan={3}>Opening Balance</td>
                              <td className="py-2 pr-4"></td>
                              <td className="py-2 pr-4"></td>
                              <td className="py-2 text-right font-medium">{formatCurrency(openingBalance, currency)}</td>
                              <td></td>
                            </tr>,
                            ...txList.map((t) => {
                              if (t.type === "credit") runBal += Number(t.amount);
                              else runBal -= Number(t.amount);
                              const bal = runBal;
                              return (
                                <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20">
                                  <td className="py-2.5 pr-4 whitespace-nowrap">{t.date}</td>
                                  <td className="py-2.5 pr-4 text-muted-foreground text-xs">{t.reference_id || "-"}</td>
                                  <td className="py-2.5 pr-4 max-w-[220px] truncate">{t.description || "-"}</td>
                                  <td className="py-2.5 pr-4 text-right text-green-600">
                                    {t.type === "credit" ? formatCurrency(Number(t.amount), currency) : ""}
                                  </td>
                                  <td className="py-2.5 pr-4 text-right text-red-600">
                                    {t.type === "debit" ? formatCurrency(Number(t.amount), currency) : ""}
                                  </td>
                                  <td className={`py-2.5 text-right font-medium ${bal >= 0 ? "text-green-700" : "text-red-700"}`}>
                                    {formatCurrency(bal, currency)}
                                  </td>
                                  <td className="py-2.5">
                                    {canDelete && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                        onClick={() => setDeletingId(t.id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              );
                            }),
                          ];
                        })()}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 font-semibold bg-muted/30">
                          <td className="py-3 pr-4 text-muted-foreground text-xs" colSpan={3}>Total</td>
                          <td className="py-3 pr-4 text-right text-green-600">{formatCurrency(totalCredit, currency)}</td>
                          <td className="py-3 pr-4 text-right text-red-600">{formatCurrency(totalDebit, currency)}</td>
                          <td className={`py-3 text-right font-bold ${closingBalance >= 0 ? "text-green-700" : "text-red-700"}`}>
                            {formatCurrency(closingBalance, currency)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Printable Ledger ── */}
            <div id="print-ledger" className="hidden print:block">
              <PrintLedger
                businessName={businessName}
                businessDescription={businessDescription}
                watermarkDataUrl={watermarkDataUrl}
                customer={selectedCustomerData}
                transactions={printTxList}
                openingBalance={openingBalance}
                totalCredit={printTxList.reduce((s, t) => s + (t.type === "credit" ? Number(t.amount) : 0), 0)}
                totalDebit={printTxList.reduce((s, t) => s + (t.type === "debit" ? Number(t.amount) : 0), 0)}
                closingBalance={openingBalance + printTxList.reduce((s, t) => s + (t.type === "credit" ? Number(t.amount) : 0), 0) - printTxList.reduce((s, t) => s + (t.type === "debit" ? Number(t.amount) : 0), 0)}
                currency={currency}
                dateFrom={exportMode === "range" ? exportFrom : ""}
                dateTo={exportMode === "range" ? exportTo : ""}
              />
            </div>
          </>
        )}
      </div>

      {/* ── Export / Print Dialog ── */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {exportAction === "print" ? (
                <Printer className="h-5 w-5 text-primary" />
              ) : (
                <Download className="h-5 w-5 text-primary" />
              )}
              {exportAction === "print" ? "Print Ledger" : "Export PDF"}
            </DialogTitle>
            <DialogDescription>
              Choose whether to include all transactions or a specific date range.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Mode toggle */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportMode("full")}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-all ${
                  exportMode === "full"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Printer className="h-5 w-5" />
                Full Data
                <span className="text-xs font-normal text-muted-foreground">All transactions</span>
              </button>
              <button
                onClick={() => setExportMode("range")}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-all ${
                  exportMode === "range"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <CalendarRange className="h-5 w-5" />
                Date Range
                <span className="text-xs font-normal text-muted-foreground">Pick from – to</span>
              </button>
            </div>

            {/* Date pickers — only shown in range mode */}
            {exportMode === "range" && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs">From Date</Label>
                  <Input
                    type="date"
                    value={exportFrom}
                    onChange={(e) => setExportFrom(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">To Date</Label>
                  <Input
                    type="date"
                    value={exportTo}
                    min={exportFrom}
                    onChange={(e) => setExportTo(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
            )}

            {/* Validation message */}
            {exportMode === "range" && (!exportFrom || !exportTo) && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Please select both a From and To date to continue.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmExport}
              disabled={exportMode === "range" && (!exportFrom || !exportTo)}
            >
              {exportAction === "print" ? (
                <><Printer className="h-4 w-4 mr-2" />Print Now</>
              ) : (
                <><Download className="h-4 w-4 mr-2" />Export PDF</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── New Customer Dialog ── */}
      <Dialog open={showNewCustomer} onOpenChange={(open) => { setShowNewCustomer(open); if (!open) setCustomerForm(emptyCustomerForm()); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              New Customer
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Customer name"
                value={customerForm.name}
                onChange={(e) => setCustomerForm((f) => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  placeholder="+91 9876543210"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input
                placeholder="Address (optional)"
                value={customerForm.address}
                onChange={(e) => setCustomerForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Opening Balance</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={customerForm.opening_balance}
                onChange={(e) => setCustomerForm((f) => ({ ...f, opening_balance: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">Amount the customer already owes you before any entries</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowNewCustomer(false); setCustomerForm(emptyCustomerForm()); }}>
              Cancel
            </Button>
            <Button onClick={handleSaveCustomer} disabled={savingCustomer || !customerForm.name.trim()}>
              {savingCustomer ? "Saving..." : "Create Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Scan Receipt Dialog ── */}
      <Dialog open={showScan} onOpenChange={setShowScan}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-primary" /> Scan Receipt
            </DialogTitle>
            <DialogDescription>
              Upload a photo of a receipt/bill. OCR runs in your browser (free). Optionally add a Gemini API key in Settings for better accuracy.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="glass-pill px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-white/80 dark:hover:bg-white/10 transition-colors inline-flex items-center gap-2">
                <Camera className="h-4 w-4" /> Choose image
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setScanFile(f);
                    setScanPreview(URL.createObjectURL(f));
                    setScanResult(null);
                    setScanError(null);
                    setScanAmount("");
                    setScanDescription("");
                    setScanDate("");
                  }}
                />
              </label>
              {scanFile && <span className="text-xs text-muted-foreground truncate max-w-[200px]">{scanFile.name}</span>}
            </div>

            {scanPreview && (
              <div className="rounded-xl overflow-hidden border bg-muted/30 flex justify-center">
                <img src={scanPreview} alt="receipt preview" className="max-h-48 object-contain" />
              </div>
            )}

            {scanFile && !scanning && !scanResult && (
              <Button
                onClick={async () => {
                  if (!scanFile) return;
                  setScanning(true);
                  setScanProgress(0);
                  setScanError(null);
                  try {
                    const result = await scanReceipt(scanFile, geminiApiKey, (p) => setScanProgress(p));
                    setScanResult(result);
                    setScanAmount(result.amount != null ? String(result.amount) : "");
                    setScanDescription(result.description ?? "");
                    setScanDate(result.date ?? new Date().toISOString().split("T")[0]);
                  } catch (e: any) {
                    setScanError(e?.message ?? "OCR failed");
                  } finally {
                    setScanning(false);
                  }
                }}
                className="w-full"
              >
                <ScanLine className="h-4 w-4 mr-2" /> Run OCR
              </Button>
            )}

            {scanning && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Recognizing text… {scanProgress}%
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${scanProgress}%` }} />
                </div>
              </div>
            )}

            {scanError && (
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> {scanError}
              </p>
            )}

            {scanResult && (
              <div className="space-y-3 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground">Extracted (edit if needed)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Amount</Label>
                    <Input type="number" step="0.01" value={scanAmount} onChange={(e) => setScanAmount(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Date</Label>
                    <Input type="date" value={scanDate} onChange={(e) => setScanDate(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Description</Label>
                  <Input value={scanDescription} onChange={(e) => setScanDescription(e.target.value)} />
                </div>
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground">Show raw OCR text</summary>
                  <pre className="mt-2 p-2 bg-muted/40 rounded text-[10px] whitespace-pre-wrap max-h-32 overflow-auto">{scanResult.text}</pre>
                </details>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowScan(false)}>Cancel</Button>
            {scanResult && (
              <Button
                onClick={() => {
                  const amount = parseFloat(scanAmount) || 0;
                  const isCredit = false;
                  // Add as a new entry row
                  setRows((prev) => [
                    ...prev,
                    {
                      date: scanDate || new Date().toISOString().split("T")[0],
                      invoice_number: "",
                      particular: scanDescription || "Scanned receipt",
                      credit: "",
                      debit: amount > 0 ? String(amount) : "",
                    },
                  ]);
                  setShowScan(false);
                  toast({ title: "Receipt added as a new entry row" });
                }}
                disabled={!scanAmount}
              >
                Add to entries
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PrintLedger({
  businessName,
  businessDescription,
  watermarkDataUrl,
  customer,
  transactions,
  openingBalance,
  totalCredit,
  totalDebit,
  closingBalance,
  currency,
  dateFrom,
  dateTo,
}: {
  businessName: string;
  businessDescription: string;
  watermarkDataUrl: string | null;
  customer: any;
  transactions: any[];
  openingBalance: number;
  totalCredit: number;
  totalDebit: number;
  closingBalance: number;
  currency: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: "13px", color: "#111", padding: "32px", position: "relative" }}>

      {/* Watermark — sits above all content, centered on every printed page */}
      {watermarkDataUrl && (
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          zIndex: 9999,
        }}>
          <img
            src={watermarkDataUrl}
            alt="watermark"
            style={{ width: "400px", height: "400px", objectFit: "contain", opacity: 0.18 }}
          />
        </div>
      )}

      <div>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "24px", borderBottom: "2px solid #1d4ed8", paddingBottom: "16px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "4px" }}>{businessName}</h1>
        {businessDescription && (
          <p style={{ color: "#444", fontSize: "11px", marginBottom: "4px", whiteSpace: "pre-line" }}>{businessDescription}</p>
        )}
        <p style={{ color: "#888", fontSize: "11px" }}>Customer Ledger Statement</p>
        {dateFrom && dateTo && (
          <p style={{ color: "#555", fontSize: "11px", marginTop: "4px" }}>
            Period: {new Date(dateFrom).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            {" — "}
            {new Date(dateTo).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        )}
      </div>

      {/* Customer info */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <p><strong>Customer:</strong> {customer?.name}</p>
          {customer?.phone && <p><strong>Phone:</strong> {customer.phone}</p>}
          {customer?.email && <p><strong>Email:</strong> {customer.email}</p>}
        </div>
        <div style={{ textAlign: "right" }}>
          <p><strong>Date:</strong> {today}</p>
          <p><strong>Opening Balance:</strong> {formatCurrency(openingBalance, currency)}</p>
        </div>
      </div>

      {/* Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "0" }}>
        <thead>
          <tr style={{ backgroundColor: "#1d4ed8", color: "white" }}>
            <th style={{ padding: "8px 10px", textAlign: "left", fontSize: "12px" }}>Date</th>
            <th style={{ padding: "8px 10px", textAlign: "left", fontSize: "12px" }}>Invoice No.</th>
            <th style={{ padding: "8px 10px", textAlign: "left", fontSize: "12px" }}>Particular</th>
            <th style={{ padding: "8px 10px", textAlign: "right", fontSize: "12px" }}>Credit</th>
            <th style={{ padding: "8px 10px", textAlign: "right", fontSize: "12px" }}>Debit</th>
            <th style={{ padding: "8px 10px", textAlign: "right", fontSize: "12px" }}>Balance</th>
          </tr>
        </thead>
        <tbody>
          {(() => {
            let runBal = openingBalance;
            return transactions.map((t, idx) => {
              if (t.type === "credit") runBal += Number(t.amount);
              else runBal -= Number(t.amount);
              const bal = runBal;
              return (
                <tr key={t.id} style={{ backgroundColor: idx % 2 === 0 ? "#f8fafc" : "#fff" }}>
                  <td style={{ padding: "7px 10px", borderBottom: "1px solid #e2e8f0" }}>{t.date}</td>
                  <td style={{ padding: "7px 10px", borderBottom: "1px solid #e2e8f0", color: "#666" }}>{t.reference_id || "-"}</td>
                  <td style={{ padding: "7px 10px", borderBottom: "1px solid #e2e8f0" }}>{t.description || "-"}</td>
                  <td style={{ padding: "7px 10px", borderBottom: "1px solid #e2e8f0", textAlign: "right", color: "#16a34a" }}>
                    {t.type === "credit" ? formatCurrency(Number(t.amount), currency) : ""}
                  </td>
                  <td style={{ padding: "7px 10px", borderBottom: "1px solid #e2e8f0", textAlign: "right", color: "#dc2626" }}>
                    {t.type === "debit" ? formatCurrency(Number(t.amount), currency) : ""}
                  </td>
                  <td style={{ padding: "7px 10px", borderBottom: "1px solid #e2e8f0", textAlign: "right", fontWeight: "500" }}>
                    {formatCurrency(bal, currency)}
                  </td>
                </tr>
              );
            });
          })()}
        </tbody>
      </table>

      {/* Totals summary */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "0" }}>
        <tbody>
          <tr style={{ backgroundColor: "#f1f5f9", fontWeight: "600" }}>
            <td style={{ padding: "9px 10px", borderTop: "2px solid #1d4ed8" }} colSpan={3}>Total</td>
            <td style={{ padding: "9px 10px", textAlign: "right", borderTop: "2px solid #1d4ed8", color: "#16a34a" }}>
              {formatCurrency(totalCredit, currency)}
            </td>
            <td style={{ padding: "9px 10px", textAlign: "right", borderTop: "2px solid #1d4ed8", color: "#dc2626" }}>
              {formatCurrency(totalDebit, currency)}
            </td>
            <td style={{ padding: "9px 10px", textAlign: "right", borderTop: "2px solid #1d4ed8" }}></td>
          </tr>
        </tbody>
      </table>

      {/* Closing statement */}
      <div style={{
        marginTop: "20px",
        padding: "16px 20px",
        backgroundColor: "#eff6ff",
        borderRadius: "6px",
        border: "1px solid #bfdbfe",
      }}>
        <p style={{ fontWeight: "700", fontSize: "14px", marginBottom: "10px", color: "#1e3a8a" }}>
          Account Summary
        </p>
        <table style={{ width: "100%", fontSize: "13px" }}>
          <tbody>
            <tr>
              <td style={{ padding: "4px 0", color: "#374151" }}>Opening Balance</td>
              <td style={{ textAlign: "right", fontWeight: "500" }}>{formatCurrency(openingBalance, currency)}</td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0", color: "#16a34a" }}>Total Credit (Amount Received)</td>
              <td style={{ textAlign: "right", fontWeight: "500", color: "#16a34a" }}>+ {formatCurrency(totalCredit, currency)}</td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0", color: "#dc2626" }}>Total Debit (Amount Paid)</td>
              <td style={{ textAlign: "right", fontWeight: "500", color: "#dc2626" }}>- {formatCurrency(totalDebit, currency)}</td>
            </tr>
            <tr style={{ borderTop: "1px solid #93c5fd" }}>
              <td style={{ padding: "8px 0 4px", fontWeight: "700", fontSize: "14px", color: closingBalance >= 0 ? "#15803d" : "#b91c1c" }}>
                Closing Balance
              </td>
              <td style={{ textAlign: "right", fontWeight: "700", fontSize: "15px", color: closingBalance >= 0 ? "#15803d" : "#b91c1c" }}>
                {formatCurrency(closingBalance, currency)}
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={{ paddingTop: "4px", color: "#6b7280", fontSize: "11px" }}>
                {closingBalance > 0
                  ? `Net Receivable: Customer owes ${formatCurrency(closingBalance, currency)}`
                  : closingBalance < 0
                  ? `Net Payable: You owe customer ${formatCurrency(Math.abs(closingBalance), currency)}`
                  : "Account is clear — no outstanding balance"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ marginTop: "32px", borderTop: "1px solid #e2e8f0", paddingTop: "12px", display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#9ca3af" }}>
        <span>Generated by {businessName}</span>
        <span>Printed on {today}</span>
      </div>
      </div>
    </div>
  );
}
