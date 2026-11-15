import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { Transaction, Customer } from "@/types/database";

export function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Prints a single element (by id) in a clean new window, so the browser's
 * print dialog only contains that template instead of the whole page.
 * Works reliably across browsers (avoids fragile CSS visibility hacks).
 */
export function printElement(elementId: string, title = "Print") {
  const el = document.getElementById(elementId);
  if (!el) return;
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return;
  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    @page { margin: 16mm; size: A4; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    * { box-sizing: border-box; }
    table { border-collapse: collapse; }
  </style>
</head>
<body>${el.outerHTML}</body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 300);
}

export function exportLedgerToPDF(
  customer: Customer,
  transactions: Transaction[],
  openingBalance: number,
  currency = "INR"
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.text("Customer Ledger", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(11);
  doc.text(`Customer: ${customer.name}`, 14, 35);
  doc.text(`Phone: ${customer.phone ?? "-"}`, 14, 42);
  doc.text(`Email: ${customer.email ?? "-"}`, 14, 49);
  doc.text(`Opening Balance: ${formatCurrency(openingBalance, currency)}`, 14, 56);
  doc.text(`Report Date: ${new Date().toLocaleDateString("en-IN")}`, 14, 63);

  let runningBalance = openingBalance;
  const rows = transactions.map((t) => {
    if (t.type === "credit") runningBalance += Number(t.amount);
    else runningBalance -= Number(t.amount);
    return [
      new Date(t.date).toLocaleDateString("en-IN"),
      t.description ?? "-",
      t.payment_mode ?? "-",
      t.type === "credit" ? formatCurrency(Number(t.amount), currency) : "-",
      t.type === "debit" ? formatCurrency(Number(t.amount), currency) : "-",
      formatCurrency(runningBalance, currency),
    ];
  });

  autoTable(doc, {
    head: [["Date", "Description", "Mode", "Credit", "Debit", "Balance"]],
    body: rows,
    startY: 72,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  doc.save(`ledger-${customer.name.replace(/\s+/g, "-")}.pdf`);
}

export function exportGlobalLedgerToPDF(
  rows: { customer: string; credit: number; debit: number; balance: number }[],
  currency = "INR"
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.text("Global Ledger Report", pageWidth / 2, 20, { align: "center" });
  doc.setFontSize(11);
  doc.text(`Report Date: ${new Date().toLocaleDateString("en-IN")}`, 14, 35);

  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalBalance = rows.reduce((s, r) => s + r.balance, 0);

  autoTable(doc, {
    head: [["Customer", "Total Credit", "Total Debit", "Balance"]],
    body: [
      ...rows.map((r) => [
        r.customer,
        formatCurrency(r.credit, currency),
        formatCurrency(r.debit, currency),
        formatCurrency(r.balance, currency),
      ]),
      [
        "TOTAL",
        formatCurrency(totalCredit, currency),
        formatCurrency(totalDebit, currency),
        formatCurrency(totalBalance, currency),
      ],
    ],
    startY: 45,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
    foot: [],
  });

  doc.save("global-ledger.pdf");
}

export function exportToCSV(
  transactions: (Transaction & { customers?: { name: string } | null })[],
  filename = "transactions"
) {
  const rows = transactions.map((t) => ({
    Date: t.date,
    Customer: t.customers?.name ?? "",
    Type: t.type,
    Amount: t.amount,
    Description: t.description ?? "",
    "Payment Mode": t.payment_mode ?? "",
    "Reference ID": t.reference_id ?? "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Transactions");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportCustomerBalancesToCSV(
  data: { name: string; totalCredit: number; totalDebit: number; balance: number }[]
) {
  const rows = data.map((r) => ({
    Customer: r.name,
    "Total Credit": r.totalCredit,
    "Total Debit": r.totalDebit,
    Balance: r.balance,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Outstanding Balances");
  XLSX.writeFile(wb, "outstanding-balances.xlsx");
}
