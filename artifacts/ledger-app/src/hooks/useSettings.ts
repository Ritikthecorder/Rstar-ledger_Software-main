import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { InsertSettings, UpdateSettings } from "@/types/database";
import { useAuthStore } from "@/store/auth";
import { useSettingsStore } from "@/store/settings";

export function useSettings() {
  const user = useAuthStore((s) => s.user);
  const setSettings = useSettingsStore((s) => s.setSettings);

  return useQuery({
    queryKey: ["settings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .single();
      if (error && error.code !== "PGRST116") throw error;
      if (data) setSettings(data);
      return data;
    },
  });
}

export function useUpsertSettings() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setSettings = useSettingsStore((s) => s.setSettings);

  return useMutation({
    mutationFn: async (input: Omit<InsertSettings | UpdateSettings, "user_id">) => {
      const { data, error } = await supabase
        .from("settings")
        .upsert({ ...input, user_id: user!.id }, { onConflict: "user_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setSettings(data);
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}
