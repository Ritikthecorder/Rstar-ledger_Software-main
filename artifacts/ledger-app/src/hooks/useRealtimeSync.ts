import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth";

export function useRealtimeSync() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`realtime-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["transactions"] });
        qc.invalidateQueries({ queryKey: ["transactions-all"] });
        qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
        qc.invalidateQueries({ queryKey: ["customer-balance"] });
        qc.invalidateQueries({ queryKey: ["outstanding-balances"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "customers", filter: `user_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["customers"] });
        qc.invalidateQueries({ queryKey: ["outstanding-balances"] });
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [user, qc]);
}
