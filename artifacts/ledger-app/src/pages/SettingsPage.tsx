import { useState, useEffect, useRef } from "react";
import { useSettings, useUpsertSettings } from "@/hooks/useSettings";
import { useSettingsStore } from "@/store/settings";
import { useBusinessProfileStore } from "@/store/businessProfile";
import { supabase } from "@/lib/supabase";
import { usePermissions } from "@/hooks/usePermissions";
import { useRemindersStore, DEFAULT_TEMPLATE } from "@/store/reminders";
import { useAuthStore } from "@/store/auth";
import { useTheme } from "@/components/ThemeProvider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Moon, Sun, Monitor, LogOut, Save, Upload, X, ImageIcon, BellRing, RotateCcw, Users, UserPlus, Trash2, Copy, Link as LinkIcon, Loader2 } from "lucide-react";

const CURRENCIES = [
  { code: "INR", label: "Indian Rupee (₹)" },
  { code: "USD", label: "US Dollar ($)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "British Pound (£)" },
  { code: "AED", label: "UAE Dirham (AED)" },
  { code: "SGD", label: "Singapore Dollar (S$)" },
];

export default function SettingsPage() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const settings = useSettingsStore((s) => s.settings);
  const { description, watermarkDataUrl, geminiApiKey, setDescription, setWatermark, setGeminiApiKey } = useBusinessProfileStore();
  const { canManageTeam, canWrite, canDelete } = usePermissions();
  const reminderDays = useRemindersStore((s) => s.reminderDays);
  const cooldownDays = useRemindersStore((s) => s.cooldownDays);
  const messageTemplate = useRemindersStore((s) => s.messageTemplate);
  const setReminderDays = useRemindersStore((s) => s.setReminderDays);
  const setCooldownDays = useRemindersStore((s) => s.setCooldownDays);
  const setMessageTemplate = useRemindersStore((s) => s.setMessageTemplate);
  const [localReminderDays, setLocalReminderDays] = useState(reminderDays);
  const [localCooldown, setLocalCooldown] = useState(cooldownDays);
  const [localTemplate, setLocalTemplate] = useState(messageTemplate);

  useSettings();
  const upsertSettings = useUpsertSettings();

  const [businessName, setBusinessName] = useState(settings?.business_name ?? "");
  const [currency, setCurrency] = useState(settings?.currency ?? "INR");
  const [localDesc, setLocalDesc] = useState(description);
  const [localGeminiKey, setLocalGeminiKey] = useState(geminiApiKey);
  const watermarkInputRef = useRef<HTMLInputElement>(null);



  // Team management
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"staff" | "viewer">("staff");
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

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
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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

  useEffect(() => {
    if (settings) {
      setBusinessName(settings.business_name ?? "");
      setCurrency(settings.currency ?? "INR");
    }
  }, [settings]);

  useEffect(() => {
    setLocalDesc(description);
  }, [description]);

  useEffect(() => {
    setLocalReminderDays(reminderDays);
  }, [reminderDays]);

  useEffect(() => {
    setLocalCooldown(cooldownDays);
  }, [cooldownDays]);

  useEffect(() => {
    setLocalTemplate(messageTemplate);
  }, [messageTemplate]);

  const handleSaveReminders = () => {
    setReminderDays(localReminderDays);
    setCooldownDays(localCooldown);
    setMessageTemplate(localTemplate.trim() || DEFAULT_TEMPLATE);
    toast({ title: "Reminder settings saved" });
  };

  const handleResetTemplate = () => {
    setLocalTemplate(DEFAULT_TEMPLATE);
  };

  const handleSave = async () => {
    try {
      await upsertSettings.mutateAsync({ business_name: businessName, currency });
      setDescription(localDesc);
      setGeminiApiKey(localGeminiKey.trim());
      toast({ title: "Settings saved" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleWatermarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Please upload an image file", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Image must be under 2MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setWatermark(result);
      toast({ title: "Watermark uploaded" });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoveWatermark = () => {
    setWatermark(null);
    toast({ title: "Watermark removed" });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {user?.email?.charAt(0).toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user?.email}</p>
              <Badge variant="secondary" className="mt-1 text-xs">Free Plan</Badge>
            </div>
          </div>
          <Separator />
          <Button variant="destructive" onClick={signOut} className="gap-2">
            <LogOut className="h-4 w-4" />Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* Business Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business Settings</CardTitle>
          <CardDescription>These details appear on all printed ledgers and statements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Business Name */}
          <div className="space-y-1.5">
            <Label>Business Name</Label>
            <Input
              className="h-10"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Your Business Name"
            />
          </div>

          {/* Currency */}
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Business Description */}
          <div className="space-y-1.5">
            <Label>Business Description</Label>
            <Textarea
              value={localDesc}
              onChange={(e) => setLocalDesc(e.target.value)}
              placeholder="e.g. GST No: 27AXXXX · Address: 123 MG Road, Mumbai · Ph: +91 9876543210"
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This text prints below your business name on every ledger and statement
            </p>
          </div>

          {/* Gemini API Key (optional, for receipt OCR) */}
          <div className="space-y-1.5">
            <Label>Gemini API Key (optional)</Label>
            <Input
              type="password"
              value={localGeminiKey}
              onChange={(e) => setLocalGeminiKey(e.target.value)}
              placeholder="AIza..."
            />
            <p className="text-xs text-muted-foreground">
              Free tier from Google AI Studio. Used to structure scanned receipts into amount/description/date. Leave blank to use offline OCR only.
            </p>
          </div>

          {/* Watermark */}
          <div className="space-y-3">
            <div>
              <Label>Print Watermark</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upload your logo or stamp — it appears as a faint watermark behind the print content
              </p>
            </div>

            {watermarkDataUrl ? (
              <div className="flex items-center gap-4 p-3 rounded-xl border bg-muted/30">
                <div className="h-16 w-16 rounded-lg border bg-white flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src={watermarkDataUrl}
                    alt="Watermark preview"
                    className="h-full w-full object-contain p-1"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Watermark uploaded</p>
                  <p className="text-xs text-muted-foreground">Will appear behind the print content</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => watermarkInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" />Change
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-destructive hover:text-destructive"
                    onClick={handleRemoveWatermark}
                  >
                    <X className="h-3.5 w-3.5" />Remove
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => watermarkInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl py-8 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
              >
                <div className="p-3 rounded-full bg-muted">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Click to upload watermark</p>
                  <p className="text-xs mt-0.5">PNG, JPG, SVG · Max 2MB</p>
                </div>
              </button>
            )}

            <input
              ref={watermarkInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleWatermarkUpload}
            />
          </div>

          <Button onClick={handleSave} disabled={upsertSettings.isPending} className="gap-2">
            <Save className="h-4 w-4" />
            {upsertSettings.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* Payment Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BellRing className="h-4 w-4 text-amber-500" />
            Payment Reminders
          </CardTitle>
          <CardDescription>
            Auto-detect overdue debit entries and send WhatsApp reminders to your customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Days before reminder</Label>
              <Input
                className="h-10"
                type="number"
                min={1}
                value={localReminderDays}
                onChange={(e) => setLocalReminderDays(parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">
                A debit becomes overdue this many days after its date
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Cooldown between reminders (days)</Label>
              <Input
                className="h-10"
                type="number"
                min={0}
                value={localCooldown}
                onChange={(e) => setLocalCooldown(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Won't ask you to re-send the same entry within this window
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Reminder message template</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={handleResetTemplate}
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            </div>
            <Textarea
              value={localTemplate}
              onChange={(e) => setLocalTemplate(e.target.value)}
              rows={5}
              className="resize-none font-mono text-xs leading-relaxed"
            />
            <p className="text-xs text-muted-foreground">
              Available placeholders:{" "}
              <code className="px-1 bg-muted rounded">{"{customer}"}</code>{" "}
              <code className="px-1 bg-muted rounded">{"{business}"}</code>{" "}
              <code className="px-1 bg-muted rounded">{"{amount}"}</code>{" "}
              <code className="px-1 bg-muted rounded">{"{date}"}</code>{" "}
              <code className="px-1 bg-muted rounded">{"{ref}"}</code>{" "}
              <code className="px-1 bg-muted rounded">{"{days}"}</code>
            </p>
          </div>

          <Button onClick={handleSaveReminders} className="gap-2">
            <Save className="h-4 w-4" />
            Save Reminder Settings
          </Button>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Choose your preferred theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {[
              { value: "light", label: "Light", icon: Sun },
              { value: "dark", label: "Dark", icon: Moon },
              { value: "system", label: "System", icon: Monitor },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value as any)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all flex-1 ${
                  theme === t.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <t.icon className={`h-5 w-5 ${theme === t.value ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-sm font-medium ${theme === t.value ? "text-primary" : "text-muted-foreground"}`}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Team / Roles ── */}
      {canManageTeam ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Team Access
            </CardTitle>
            <CardDescription>
              Invite staff with read-only (viewer) or entry (staff) permissions. They'll see your ledger when they log in.
            </CardDescription>
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

            <p className="text-xs text-muted-foreground">
              Share the invite link. When they open it and sign in, they'll be added to your team with the chosen role.
            </p>

            <div className="space-y-2 pt-2">
              <p className="text-sm font-medium">Team members</p>
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
      ) : null}


    </div>
  );
}
