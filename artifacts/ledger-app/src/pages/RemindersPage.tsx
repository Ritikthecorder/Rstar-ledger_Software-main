import { useMemo } from "react";
import { Link } from "wouter";
import { useOverdueReminders } from "@/hooks/useOverdueReminders";
import { useRemindersStore } from "@/store/reminders";
import { useSettingsStore } from "@/store/settings";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, CheckCircle2, RotateCcw, BellRing } from "lucide-react";
import {
  buildWhatsAppLink,
  formatReminderMessageForTransaction,
} from "@/lib/reminders";
import { formatCurrency } from "@/lib/export";

export default function RemindersPage() {
  const { toast } = useToast();
  const { data, isLoading } = useOverdueReminders();
  const settings = useSettingsStore((s) => s.settings);
  const currency = settings?.currency ?? "INR";
  const businessName = settings?.business_name ?? "";

  const messageTemplate = useRemindersStore((s) => s.messageTemplate);
  const reminderDays = useRemindersStore((s) => s.reminderDays);
  const cooldownDays = useRemindersStore((s) => s.cooldownDays);
  const sentLog = useRemindersStore((s) => s.sentLog);
  const markSent = useRemindersStore((s) => s.markSent);
  const clearSent = useRemindersStore((s) => s.clearSent);

  const entries = data ?? [];

  const pending = useMemo(
    () => entries.filter((e) => !e.alreadySent || !e.cooldownActive),
    [entries]
  );

  const handleSendOne = (entryId: string) => {
    const entry = entries.find((e) => e.transaction.id === entryId);
    if (!entry) return;
    if (!entry.customer.phone) {
      toast({
        title: "No phone number",
        description: `${entry.customer.name} has no phone number. Add one on their profile.`,
        variant: "destructive",
      });
      return;
    }

    const message = formatReminderMessageForTransaction({
      template: messageTemplate,
      businessName,
      customerName: entry.customer.name,
      transaction: entry.transaction,
      currency,
      daysOverdue: entry.daysOverdue,
    });

    const url = buildWhatsAppLink(entry.customer.phone, message);
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win) {
      toast({
        title: "Pop-up blocked",
        description: "Please allow pop-ups for this site to open WhatsApp.",
        variant: "destructive",
      });
      return;
    }
    markSent(entry.transaction.id);
    toast({ title: "Reminder marked as sent" });
  };

  const handleSendAll = () => {
    const toSend = pending.filter((e) => e.customer.phone);
    if (toSend.length === 0) {
      toast({ title: "Nothing to send", description: "No pending reminders with phone numbers." });
      return;
    }

    toSend.forEach((entry, idx) => {
      setTimeout(() => {
        const message = formatReminderMessageForTransaction({
          template: messageTemplate,
          businessName,
          customerName: entry.customer.name,
          transaction: entry.transaction,
          currency,
          daysOverdue: entry.daysOverdue,
        });
        const url = buildWhatsAppLink(entry.customer.phone!, message);
        window.open(url, "_blank", "noopener,noreferrer");
        markSent(entry.transaction.id);
      }, idx * 600);
    });

    toast({
      title: `Opening ${toSend.length} reminder${toSend.length === 1 ? "" : "s"}`,
      description: "Each will open in a new WhatsApp tab. Allow pop-ups if blocked.",
    });
  };

  const noPhone = entries.filter((e) => !e.customer.phone).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BellRing className="h-6 w-6 text-amber-500" />
            Payment Reminders
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Debit entries older than <strong>{reminderDays} days</strong> where the customer still owes money.
            Reminders are throttled by a <strong>{cooldownDays}-day cooldown</strong> per entry.
          </p>
        </div>
        {pending.length > 0 && (
          <Button onClick={handleSendAll} className="gap-2" size="sm">
            <MessageCircle className="h-4 w-4" />
            Send All ({pending.filter((e) => e.customer.phone).length})
          </Button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Total Overdue" value={String(entries.length)} accent="text-amber-600" />
        <SummaryCard label="Awaiting Reminder" value={String(pending.length)} accent="text-red-600" />
        <SummaryCard
          label="Outstanding Amount"
          value={formatCurrency(
            entries.reduce((s, e) => s + Number(e.transaction.amount), 0),
            currency
          )}
          accent="text-foreground"
        />
        <SummaryCard label="Missing Phone" value={String(noPhone)} accent="text-muted-foreground" />
      </div>

      {/* List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Overdue entries</CardTitle>
          <CardDescription>
            Click "Send" to open WhatsApp with a pre-filled reminder message.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
              <p className="font-medium">All clear</p>
              <p className="text-sm text-muted-foreground mt-1">
                No customer has a debit entry older than {reminderDays} days.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Customer</th>
                    <th className="pb-3 pr-4 font-medium">Entry Date</th>
                    <th className="pb-3 pr-4 font-medium text-right">Amount</th>
                    <th className="pb-3 pr-4 font-medium">Days Overdue</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => {
                    const lastSent = sentLog[e.transaction.id];
                    return (
                      <tr key={e.transaction.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 pr-4">
                          <Link href={`/customers/${e.customer.id}`} className="hover:underline">
                            <div className="font-medium">{e.customer.name}</div>
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            {e.customer.phone || (
                              <span className="text-destructive">No phone</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap">{e.transaction.date}</td>
                        <td className="py-3 pr-4 text-right text-red-600 font-semibold">
                          {formatCurrency(Number(e.transaction.amount), currency)}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge
                            variant="outline"
                            className={
                              e.daysOverdue >= 30
                                ? "border-red-500 text-red-600"
                                : "border-amber-500 text-amber-600"
                            }
                          >
                            {e.daysOverdue} days
                          </Badge>
                        </td>
                        <td className="py-3 pr-4">
                          {!e.alreadySent ? (
                            <Badge variant="secondary" className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
                              Not sent
                            </Badge>
                          ) : e.cooldownActive ? (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                              Cooling down
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                              Re-send ready
                            </Badge>
                          )}
                          {lastSent && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Last: {new Date(lastSent).toLocaleDateString("en-IN")}
                            </div>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant={e.cooldownActive ? "outline" : "default"}
                              onClick={() => handleSendOne(e.transaction.id)}
                              disabled={!e.customer.phone}
                              className="gap-1.5"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              {e.alreadySent ? "Re-send" : "Send"}
                            </Button>
                            {e.alreadySent && (
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Reset reminder status"
                                onClick={() => {
                                  clearSent(e.transaction.id);
                                  toast({ title: "Reminder status reset" });
                                }}
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-lg font-semibold mt-1 ${accent}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
