import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { InsertCustomer, UpdateCustomer } from "@/types/database";
import { useAuthStore } from "@/store/auth";
import { useOrganizationStore } from "@/store/organization";

export function useCustomers() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["customers", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useCustomer(id: string) {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["customers", id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const organizationId = useOrganizationStore((s) => s.organizationId);
  return useMutation({
    mutationFn: async (input: Omit<InsertCustomer, "user_id">) => {
      const oid = organizationId ?? user!.id;
      const { data, error } = await supabase
        .from("customers")
        .insert({ ...input, user_id: oid, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateCustomer & { id: string }) => {
      const { data, error } = await supabase
        .from("customers")
        .update(input)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}
