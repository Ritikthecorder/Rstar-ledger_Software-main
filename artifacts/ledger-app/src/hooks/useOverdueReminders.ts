import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth";
import { useRemindersStore } from "@/store/reminders";
import { daysBetween, type OverdueEntry } from "@/lib/reminders";
import type { Transaction, Customer } from "@/types/database";

interface RawTxn extends Transaction {
  customers: Pick<Customer, "id" | "name" | "phone"> | null;
}

export function useOverdueReminders() {
  const user = useAuthStore((s) => s.user);
  const reminderDays = useRemindersStore((s) => s.reminderDays);
  const cooldownDays = useRemindersStore((s) => s.cooldownDays);
  const sentLog = useRemindersStore((s) => s.sentLog);

  return useQuery({
    queryKey: ["overdue-reminders", user?.id, reminderDays, cooldownDays, sentLog],
    enabled: !!user,
    queryFn: async (): Promise<OverdueEntry[]> => {
      const customersResp = await supabase
        .from("customers")
        .select("id, name, phone, opening_balance");

      const transactionsResp = await supabase
        .from("transactions")
        .select("*, customers(id, name, phone)")
        .order("date", { ascending: true });

      const customers = (customersResp.data ?? []) as Array<{
        id: string;
        name: string;
        phone: string | null;
        opening_balance: number | null;
      }>;
      const transactions = (transactionsResp.data ?? []) as unknown as RawTxn[];

      if (customers.length === 0 || transactions.length === 0) return [];

      const byCustomer: Record<string, { balance: number; opening: number }> = {};
      for (const c of customers) {
        byCustomer[c.id] = {
          balance: Number(c.opening_balance ?? 0),
          opening: Number(c.opening_balance ?? 0),
        };
      }

      const debitsToCheck: RawTxn[] = [];
      for (const t of transactions) {
        const acc = byCustomer[t.customer_id];
        if (!acc) continue;
        if (t.type === "credit") acc.balance += Number(t.amount);
        else acc.balance -= Number(t.amount);
        if (t.type === "debit") debitsToCheck.push(t);
      }

      const today = new Date();
      const overdue: OverdueEntry[] = [];

      for (const t of debitsToCheck) {
        const acc = byCustomer[t.customer_id];
        if (!acc) continue;
        if (acc.balance >= 0) continue;

        const days = daysBetween(t.date, today);
        if (days < reminderDays) continue;
        if (!t.customers) continue;

        const lastSentAt = sentLog[t.id] ?? null;
        const cooldownActive = lastSentAt
          ? daysBetween(lastSentAt, today) < cooldownDays
          : false;

        overdue.push({
          transaction: t,
          customer: t.customers,
          daysOverdue: days,
          alreadySent: !!lastSentAt,
          cooldownActive,
          lastSentAt,
        });
      }

      overdue.sort((a, b) => b.daysOverdue - a.daysOverdue);
      return overdue;
    },
  });
}
