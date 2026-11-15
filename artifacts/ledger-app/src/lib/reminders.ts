import type { Transaction, Customer } from "@/types/database";
import { formatCurrency } from "@/lib/export";

export interface OverdueEntry {
  transaction: Transaction;
  customer: Pick<Customer, "id" | "name" | "phone">;
  daysOverdue: number;
  alreadySent: boolean;
  cooldownActive: boolean;
  lastSentAt: string | null;
}

export function daysBetween(fromIso: string, toDate: Date = new Date()) {
  const from = new Date(fromIso);
  const ms = toDate.getTime() - from.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function buildReminderMessage(
  template: string,
  args: {
    customer: string;
    business: string;
    amount: string;
    date: string;
    ref: string;
    days: number;
  }
) {
  return template
    .replaceAll("{customer}", args.customer)
    .replaceAll("{business}", args.business || "us")
    .replaceAll("{amount}", args.amount)
    .replaceAll("{date}", args.date)
    .replaceAll("{ref}", args.ref || "-")
    .replaceAll("{days}", String(args.days));
}

export function buildWhatsAppLink(rawPhone: string, message: string) {
  const phone = rawPhone.replace(/[^\d]/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function formatReminderMessageForTransaction(opts: {
  template: string;
  businessName: string;
  customerName: string;
  transaction: Transaction;
  currency: string;
  daysOverdue: number;
}) {
  const { template, businessName, customerName, transaction, currency, daysOverdue } = opts;
  return buildReminderMessage(template, {
    customer: customerName,
    business: businessName,
    amount: formatCurrency(Number(transaction.amount), currency),
    date: new Date(transaction.date).toLocaleDateString("en-IN"),
    ref: transaction.reference_id ?? "",
    days: daysOverdue,
  });
}

/**
 * Placeholder for plugging in a real SMS/WhatsApp gateway later
 * (Twilio, MSG91, Fast2SMS, etc.).
 *
 * To enable real automatic sending you will need:
 *   1. An account with the gateway and an API key stored as an env var
 *   2. A backend route or Supabase Edge Function that calls this function
 *   3. A daily scheduler (pg_cron / Reserved-VM cron) that hits that route
 *
 * Replace the body of this function with the gateway SDK call when ready.
 */
export async function sendSmsReminder(_phone: string, _message: string): Promise<void> {
  throw new Error(
    "No SMS provider configured yet. Use the WhatsApp share button for now, " +
      "or wire up Twilio / MSG91 inside lib/reminders.ts → sendSmsReminder()."
  );
}
