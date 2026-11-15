import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizationStore } from "@/store/organization";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle, Users } from "lucide-react";
import LoginPage from "@/pages/LoginPage";

export default function InvitePage() {
  const [, params] = useRoute("/invite/:token");
  const token = params?.token ?? "";
  const { user, loading } = useAuth();
  const resetOrg = useOrganizationStore((s) => s.reset);

  const [status, setStatus] = useState<"loading" | "accepting" | "success" | "error" | "needLogin">("loading");
  const [message, setMessage] = useState("");
  const [ownerName, setOwnerName] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setStatus("needLogin");
      return;
    }

    (async () => {
      setStatus("accepting");
      try {
        // Find the pending invite by token
        const { data: invite, error: findErr } = await (supabase as any)
          .from("business_members")
          .select("*")
          .eq("invite_token", token)
          .maybeSingle();

        if (findErr || !invite) {
          setStatus("error");
          setMessage("Invite not found or expired.");
          return;
        }
        if (invite.status === "revoked") {
          setStatus("error");
          setMessage("This invite has been revoked.");
          return;
        }
        if (invite.status === "active" && invite.member_user_id === user.id) {
          setStatus("success");
          setMessage("You're already a member of this team.");
          return;
        }

        // Accept the invite
        const { error: updErr } = await (supabase as any)
          .from("business_members")
          .update({
            member_user_id: user.id,
            status: "active",
            accepted_at: new Date().toISOString(),
          })
          .eq("invite_token", token);

        if (updErr) throw updErr;

        // Fetch owner's business name
        const { data: settings } = await (supabase as any)
          .from("settings")
          .select("business_name")
          .eq("user_id", invite.owner_id)
          .maybeSingle();
        setOwnerName(settings?.business_name ?? "the team");

        setStatus("success");
        setMessage(`You've joined ${settings?.business_name ?? "the team"} as ${invite.role}.`);
        resetOrg();
      } catch (e: any) {
        setStatus("error");
        setMessage(e?.message ?? "Failed to accept invite.");
      }
    })();
  }, [token, user, loading, resetOrg]);

  if (loading || status === "loading" || status === "accepting") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="mx-auto text-primary animate-spin" size={36} />
          <p className="text-sm text-muted-foreground">Processing invite…</p>
        </div>
      </div>
    );
  }

  if (status === "needLogin") {
    // Render the normal login screen; once authenticated, the effect above
    // will automatically accept the invite.
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-destructive" />
            )}
            {status === "success" ? "Welcome to the team!" : "Invite error"}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/">
            <Button className="w-full">Go to app</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}