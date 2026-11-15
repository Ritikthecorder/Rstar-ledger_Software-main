import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuthStore } from "@/store/auth";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Users, UserPlus, Trash2, Copy, Link as LinkIcon, Shield, ArrowLeft, Info,
} from "lucide-react";
import { Loader2 } from "lucide-react";

export default function AdminPage() {
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);
  const { canManageTeam } = usePermissions();

  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"staff" | "viewer">("staff");
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Activity feed: recent records created by team members
  const [activity, setActivity] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const fetchActivity = async () => {
    if (!user) return;
    setLoadingActivity(true);
    const { data: txns } = await (supabase as any)
      .from("transactions")
      .select("id, type, amount, description, date, created_at, created_by, customers(name)")
      .eq("user_id", user.id)
      .not("created_by", "is", null)
      .order("created_at", { ascending: false })
      .limit(40);
    setActivity(txns ?? []);
    setLoadingActivity(false);
  };

  const fetchMembers = async () => {
    if (!user) return;
    setLoadingMembers(true);
    const { data } = await (supabase as any)
      .from("business_members")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    setMembers(data ?? []);
    setLoadingMembers(false);
  };

  useEffect(() => {
    if (canManageTeam) {
      fetchMembers();
      fetchActivity();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, canManageTeam]);

  const handleInvite = async () => {
    if (!user || !inviteEmail.trim()) return;
    setInviting(true);
    setInviteLink(null);
    try {
      const { data, error } = await (supabase as any)
        .from("business_members")
        .insert({
          owner_id: user.id,
          invited_email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
        })
        .select()
        .single();
      if (error) throw error;
      const link = `${window.location.origin}/invite/${data.invite_token}`;
      setInviteLink(link);
      setInviteEmail("");
      await fetchMembers();
      toast({ title: "Invite created", description: "Share the link with your team member." });
    } catch (e: any) {
      toast({ title: "Invite failed", description: e.message, variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await (supabase as any).from("business_members").update({ status: "revoked" }).eq("id", id);
      await fetchMembers();
      toast({ title: "Member revoked" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleChangeRole = async (id: string, role: "staff" | "viewer") => {
    try {
      await (supabase as any).from("business_members").update({ role }).eq("id", id);
      await fetchMembers();
      toast({ title: "Role updated" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleCopyInvite = (link: string) => {
    navigator.clipboard.writeText(link).then(() => toast({ title: "Link copied" }));
  };

  if (!canManageTeam) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" /> Access denied
            </CardTitle>
            <CardDescription>
              Only the business owner can access the admin page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">Go back</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your team and access permissions</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => setShowInfo(true)}
          aria-label="Role information"
        >
          <Info className="h-4 w-4" />
        </Button>
      </div>

      {/* Team management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Team Members
          </CardTitle>
          <CardDescription>Invite and manage your staff</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="email"
              placeholder="teammate@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1"
            />
            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "staff" | "viewer")}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff (entry)</SelectItem>
                <SelectItem value="viewer">Viewer (read-only)</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()} className="gap-2">
              {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Invite
            </Button>
          </div>

          {inviteLink && (
            <div className="flex items-center gap-2 p-3 rounded-xl border bg-muted/30">
              <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                readOnly
                value={inviteLink}
                className="flex-1 bg-transparent text-xs text-muted-foreground outline-none"
              />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopyInvite(inviteLink)}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          <div className="space-y-2 pt-2">
            {loadingMembers ? (
              <p className="text-xs text-muted-foreground">Loading…</p>
            ) : members.length === 0 ? (
              <p className="text-xs text-muted-foreground">No team members yet.</p>
            ) : (
              members.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2 p-3 rounded-xl border bg-muted/20">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.invited_email}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.status === "active" ? "Active" : m.status === "pending" ? "Pending invite" : "Revoked"} · {m.role}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select
                      value={m.role}
                      onValueChange={(v) => handleChangeRole(m.id, v as "staff" | "viewer")}
                      disabled={m.status === "revoked"}
                    >
                      <SelectTrigger className="h-8 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    {m.status !== "revoked" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleRevoke(m.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Activity feed ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Recent Activity
          </CardTitle>
          <CardDescription>
            Latest entries created by you and your team. Staff entries appear here automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingActivity ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : activity.length === 0 ? (
            <p className="text-xs text-muted-foreground">No activity yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">Date</th>
                    <th className="pb-2 pr-3 font-medium">Type</th>
                    <th className="pb-2 pr-3 font-medium">Customer</th>
                    <th className="pb-2 pr-3 font-medium text-right">Amount</th>
                    <th className="pb-2 pr-3 font-medium">Description</th>
                    <th className="pb-2 font-medium">Created by</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map((t) => (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 whitespace-nowrap">{t.date}</td>
                      <td className="py-2 pr-3 capitalize">
                        <span className={t.type === "credit" ? "text-green-600" : "text-red-600"}>{t.type}</span>
                      </td>
                      <td className="py-2 pr-3">{(t as any).customers?.name ?? "-"}</td>
                      <td className={`py-2 pr-3 text-right font-medium ${t.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                        {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(t.amount))}
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground max-w-[160px] truncate">{t.description ?? "-"}</td>
                      <td className="py-2 text-xs">
                        {t.created_by === user?.id ? (
                          <span className="text-muted-foreground">You (owner)</span>
                        ) : (
                          <span className="font-medium text-primary">
                            {members.find((m) => m.member_user_id === t.created_by)?.invited_email ?? "Staff"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="pt-3">
            <Button variant="outline" size="sm" onClick={fetchActivity} className="gap-2">
              <Users className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Role info dialog ── */}
      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" /> Roles & Permissions
            </DialogTitle>
            <DialogDescription>
              What each role can see and do in your business.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">Capability</th>
                    <th className="pb-2 pr-3 font-medium text-center">Owner</th>
                    <th className="pb-2 pr-3 font-medium text-center">Staff</th>
                    <th className="pb-2 font-medium text-center">Viewer</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["View ledger & reports", "✅", "❌", "❌"],
                    ["View customers", "✅", "✅", "✅"],
                    ["Add/edit entries", "✅", "✅", "❌"],
                    ["Manage customers", "✅", "✅", "❌"],
                    ["Delete records", "✅", "❌", "❌"],
                    ["Manage team", "✅", "❌", "❌"],
                    ["Business settings", "✅", "❌", "❌"],
                  ].map(([cap, o, s, v]) => (
                    <tr key={cap} className="border-b last:border-0">
                      <td className="py-1.5 pr-3">{cap}</td>
                      <td className="py-1.5 pr-3 text-center">{o}</td>
                      <td className="py-1.5 pr-3 text-center">{s}</td>
                      <td className="py-1.5 text-center">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-xl border bg-muted/20">
              <p className="font-semibold flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Owner</p>
              <p className="text-xs text-muted-foreground mt-1">
                Full control. Can view all data, add/edit/delete records, manage team, change business settings, and access the Admin page.
              </p>
            </div>
            <div className="p-3 rounded-xl border bg-muted/20">
              <p className="font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Staff</p>
              <p className="text-xs text-muted-foreground mt-1">
                Can add and edit customers and entries, and view customers/transactions. Cannot see sales reports, ledger totals, settings, or delete records. Cannot manage the team.
              </p>
            </div>
            <div className="p-3 rounded-xl border bg-muted/20">
              <p className="font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> Viewer</p>
              <p className="text-xs text-muted-foreground mt-1">
                Read-only access to customers and transactions. Cannot add, edit, or delete anything. Cannot see sales reports, ledger totals, or settings.
              </p>
            </div>
            <div className="p-3 rounded-xl border bg-amber-50 dark:bg-amber-950/30">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <strong>Tip:</strong> Staff entries are recorded under your business (owner) and appear in your ledger. The "Recent Activity" table shows who created each entry.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}