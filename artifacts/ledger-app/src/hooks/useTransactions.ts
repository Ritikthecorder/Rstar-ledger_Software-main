import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { InsertTransaction, UpdateTransaction } from "@/types/database";
import { useAuthStore } from "@/store/auth";
import { useOrganizationStore } from "@/store/organization";

export interface TransactionFilters {
  customerId?: string;
  type?: "credit" | "debit";
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export function useTransactions(filters: TransactionFilters = {}) {
  const user = useAuthStore((s) => s.user);
  const { customerId, type, startDate, endDate, page = 1, pageSize = 20 } = filters;

  return useQuery({
    queryKey: ["transactions", user?.id, filters],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from("transactions")
        .select("*, customers(id, name)", { count: "exact" })
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (customerId) query = query.eq("customer_id", customerId);
      if (type) query = query.eq("type", type);
      if (startDate) query = query.gte("date", startDate);
      if (endDate) query = query.lte("date", endDate);

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data ?? [], count: count ?? 0 };
    },
  });
}

export function useAllTransactions(customerId?: string) {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["transactions-all", user?.id, customerId],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from("transactions")
        .select("*, customers(id, name)")
        .order("date", { ascending: false });

      if (customerId) query = query.eq("customer_id", customerId);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDashboardStats() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["dashboard-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("type, amount, date");
      if (error) throw error;

      const totalCredit = (data ?? [])
        .filter((t) => t.type === "credit")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalDebit = (data ?? [])
        .filter((t) => t.type === "debit")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const { count: customerCount } = await supabase
        .from("customers")
        .select("id", { count: "exact", head: true });

      const monthlyData: Record<string, { credit: number; debit: number }> = {};
      (data ?? []).forEach((t) => {
        const month = t.date.slice(0, 7);
        if (!monthlyData[month]) monthlyData[month] = { credit: 0, debit: 0 };
        if (t.type === "credit") monthlyData[month].credit += Number(t.amount);
        else monthlyData[month].debit += Number(t.amount);
      });

      const chartData = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([month, v]) => ({
          month,
          credit: v.credit,
          debit: v.debit,
        }));

      return {
        totalCredit,
        totalDebit,
        balance: totalCredit - totalDebit,
        customerCount: customerCount ?? 0,
        chartData,
      };
    },
  });
}

export function useCustomerBalance(customerId: string) {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["customer-balance", user?.id, customerId],
    enabled: !!user && !!customerId,
    queryFn: async () => {
      const [{ data: customer }, { data: transactions }] = await Promise.all([
        supabase.from("customers").select("opening_balance").eq("id", customerId).single(),
        supabase.from("transactions").select("type, amount, date").eq("customer_id", customerId).order("date"),
      ]);

      if (!customer) return { balance: 0, runningBalances: [] };

      let balance = Number(customer.opening_balance ?? 0);
      const runningBalances = (transactions ?? []).map((t) => {
        if (t.type === "credit") balance += Number(t.amount);
        else balance -= Number(t.amount);
        return { date: t.date, balance };
      });

      return { balance, runningBalances };
    },
  });
}

export function useCustomerOutstandingBalances() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["outstanding-balances", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: customers }, { data: transactions }] = await Promise.all([
        supabase.from("customers").select("id, name, opening_balance"),
        supabase.from("transactions").select("customer_id, type, amount"),
      ]);

      return (customers ?? []).map((c) => {
        const txns = (transactions ?? []).filter((t) => t.customer_id === c.id);
        const credit = txns.filter((t) => t.type === "credit").reduce((s, t) => s + Number(t.amount), 0);
        const debit = txns.filter((t) => t.type === "debit").reduce((s, t) => s + Number(t.amount), 0);
        const balance = Number(c.opening_balance ?? 0) + credit - debit;
        return { ...c, balance, totalCredit: credit, totalDebit: debit };
      });
    },
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const organizationId = useOrganizationStore((s) => s.organizationId);
  return useMutation({
    mutationFn: async (input: Omit<InsertTransaction, "user_id">) => {
      const oid = organizationId ?? user!.id;
      const { data, error } = await supabase
        .from("transactions")
        .insert({ ...input, user_id: oid, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["transactions-all"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["customer-balance"] });
      qc.invalidateQueries({ queryKey: ["outstanding-balances"] });
    },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateTransaction & { id: string }) => {
      const { data, error } = await supabase
        .from("transactions")
        .update(input)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["transactions-all"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["customer-balance"] });
      qc.invalidateQueries({ queryKey: ["outstanding-balances"] });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["transactions-all"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["customer-balance"] });
      qc.invalidateQueries({ queryKey: ["outstanding-balances"] });
    },
  });
}
