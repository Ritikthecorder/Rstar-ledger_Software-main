import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";
import type { Customer, Transaction } from "@/types/database";

export interface BackupData {
  version: number;
  exportedAt: string;
  businessName: string;
  customers: Omit<Customer, "user_id">[];
  transactions: Omit<Transaction, "user_id">[];
}

export interface RestoreResult {
  customersInserted: number;
  transactionsInserted: number;
  errors: string[];
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function fetchAllData(userId: string) {
  const [{ data: customers }, { data: transactions }] = await Promise.all([
    supabase.from("customers").select("*").eq("user_id", userId).order("name"),
    supabase.from("transactions").select("*, customers(id, name)").eq("user_id", userId).order("date", { ascending: false }),
  ]);
  return { customers: customers ?? [], transactions: transactions ?? [] };
}

export function buildBackupPayload(
  customers: Customer[],
  transactions: Transaction[],
  businessName: string
): BackupData {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    businessName,
    customers: customers.map(({ user_id: _, ...rest }) => rest),
    transactions: transactions.map(({ user_id: _, ...rest }) => rest),
  };
}

export function downloadJSON(payload: BackupData) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const date = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, `ledgerpro-backup-${date}.json`);
}

export function downloadCSV(customers: Customer[], transactions: (Transaction & { customers?: { name: string } | null })[]) {
  const txRows = transactions.map((t) => [
    t.date, (t as any).customers?.name ?? "", t.type, t.amount,
    t.description ?? "", t.payment_mode ?? "", t.reference_id ?? "",
  ]);
  const txCSV = [
    ["Date", "Customer", "Type", "Amount", "Description", "Payment Mode", "Reference ID"],
    ...txRows,
  ].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");

  const custRows = customers.map((c) => [
    c.name, c.phone ?? "", c.email ?? "", c.address ?? "", c.opening_balance,
  ]);
  const custCSV = [
    ["Name", "Phone", "Email", "Address", "Opening Balance"],
    ...custRows,
  ].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");

  const date = new Date().toISOString().slice(0, 10);
  triggerDownload(new Blob([txCSV], { type: "text/csv" }), `ledgerpro-transactions-${date}.csv`);
  setTimeout(() => {
    triggerDownload(new Blob([custCSV], { type: "text/csv" }), `ledgerpro-customers-${date}.csv`);
  }, 300);
}

export function downloadExcel(
  customers: Customer[],
  transactions: (Transaction & { customers?: { name: string } | null })[]
) {
  const wb = XLSX.utils.book_new();

  const txRows = transactions.map((t) => ({
    Date: t.date,
    Customer: (t as any).customers?.name ?? "",
    Type: t.type,
    Amount: Number(t.amount),
    Description: t.description ?? "",
    "Payment Mode": t.payment_mode ?? "",
    "Reference ID": t.reference_id ?? "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txRows), "Transactions");

  const custRows = customers.map((c) => ({
    Name: c.name,
    Phone: c.phone ?? "",
    Email: c.email ?? "",
    Address: c.address ?? "",
    "Opening Balance": Number(c.opening_balance),
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(custRows), "Customers");

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `ledgerpro-backup-${date}.xlsx`);
}

export function parseBackupFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.version || !Array.isArray(parsed.customers) || !Array.isArray(parsed.transactions)) {
          reject(new Error("Invalid backup file format."));
          return;
        }
        resolve(parsed as BackupData);
      } catch {
        reject(new Error("Could not read the file. Make sure it is a valid LedgerPro backup JSON."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsText(file);
  });
}

export interface DeduplicateResult {
  customersRemoved: number;
  transactionsRemoved: number;
  errors: string[];
}

export async function removeDuplicates(userId: string): Promise<DeduplicateResult> {
  const result: DeduplicateResult = { customersRemoved: 0, transactionsRemoved: 0, errors: [] };

  const [{ data: allCustomers }, { data: allTransactions }] = await Promise.all([
    (supabase as any).from("customers").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    (supabase as any).from("transactions").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
  ]);

  const customers: any[] = allCustomers ?? [];
  const transactions: any[] = allTransactions ?? [];

  const seenNames = new Map<string, string>();
  for (const c of customers) {
    const key = (c.name ?? "").toLowerCase().trim();
    if (seenNames.has(key)) {
      const keeperId = seenNames.get(key)!;
      for (const t of transactions.filter((tx) => tx.customer_id === c.id)) {
        const { error } = await (supabase as any).from("transactions").update({ customer_id: keeperId }).eq("id", t.id);
        if (error) result.errors.push(`Re-assign tx ${t.id}: ${error.message}`);
      }
      const { error } = await (supabase as any).from("customers").delete().eq("id", c.id);
      if (error) result.errors.push(`Delete customer ${c.name}: ${error.message}`);
      else result.customersRemoved++;
    } else {
      seenNames.set(key, c.id);
    }
  }

  const freshTx: any[] = ((await (supabase as any).from("transactions").select("*").eq("user_id", userId).order("created_at", { ascending: true })).data) ?? [];
  const seenTxKeys = new Set<string>();
  for (const t of freshTx) {
    const key = `${t.customer_id}|${t.date}|${t.amount}|${t.type}`;
    if (seenTxKeys.has(key)) {
      const { error } = await (supabase as any).from("transactions").delete().eq("id", t.id);
      if (error) result.errors.push(`Delete tx ${t.id}: ${error.message}`);
      else result.transactionsRemoved++;
    } else {
      seenTxKeys.add(key);
    }
  }

  return result;
}

export async function restoreFromBackup(payload: BackupData, userId: string): Promise<RestoreResult> {
  const result: RestoreResult = { customersInserted: 0, transactionsInserted: 0, errors: [] };

  const [{ data: existingCustomers }, { data: existingTransactions }] = await Promise.all([
    (supabase as any).from("customers").select("id").eq("user_id", userId),
    (supabase as any).from("transactions").select("id").eq("user_id", userId),
  ]);
  const existingCustomerIds = new Set((existingCustomers ?? []).map((c: any) => c.id));
  const existingTransactionIds = new Set((existingTransactions ?? []).map((t: any) => t.id));

  for (const c of payload.customers) {
    if (c.id && existingCustomerIds.has(c.id)) continue;
    try {
      const { error } = await (supabase as any)
        .from("customers")
        .insert({ id: c.id, name: c.name, phone: c.phone, email: c.email, address: c.address, opening_balance: c.opening_balance, user_id: userId });
      if (error) throw error;
      result.customersInserted++;
    } catch (e: any) {
      result.errors.push(`Customer "${c.name}": ${e.message}`);
    }
  }

  for (const t of payload.transactions) {
    if (t.id && existingTransactionIds.has(t.id)) continue;
    try {
      const { error } = await (supabase as any)
        .from("transactions")
        .insert({
          id: t.id,
          user_id: userId,
          customer_id: t.customer_id,
          type: t.type,
          amount: t.amount,
          description: t.description,
          payment_mode: t.payment_mode,
          reference_id: t.reference_id,
          date: t.date,
          attachment_url: t.attachment_url,
        });
      if (error) throw error;
      result.transactionsInserted++;
    } catch (e: any) {
      result.errors.push(`Transaction on ${t.date}: ${e.message}`);
    }
  }

  return result;
}
