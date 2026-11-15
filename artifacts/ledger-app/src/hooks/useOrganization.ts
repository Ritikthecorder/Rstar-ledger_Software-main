import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth";
import { useOrganizationStore } from "@/store/organization";

export function useOrganization() {
  const user = useAuthStore((s) => s.user);
  const setOrganization = useOrganizationStore((s) => s.setOrganization);
  const reset = useOrganizationStore((s) => s.reset);

  useEffect(() => {
    if (!user) {
      reset();
      return;
    }

    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("business_members")
        .select("id, owner_id, role, status")
        .eq("member_user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (cancelled) return;

      if (data) {
        setOrganization(data.owner_id, data.role as "staff" | "viewer", data.id);
      } else {
        // Not a member → this user is an owner of their own business
        setOrganization(user.id, "owner", null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, setOrganization, reset]);
}