import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RemindersState {
  reminderDays: number;
  cooldownDays: number;
  messageTemplate: string;
  sentLog: Record<string, string>;
  setReminderDays: (days: number) => void;
  setCooldownDays: (days: number) => void;
  setMessageTemplate: (tpl: string) => void;
  markSent: (transactionId: string, isoDate?: string) => void;
  clearSent: (transactionId: string) => void;
}

export const DEFAULT_TEMPLATE =
  "Hi {customer}, this is a friendly reminder from {business}. " +
  "An amount of {amount} from {date} (Ref: {ref}) is pending for {days} days. " +
  "Please arrange the payment at your earliest convenience. Thank you.";

export const useRemindersStore = create<RemindersState>()(
  persist(
    (set) => ({
      reminderDays: 15,
      cooldownDays: 7,
      messageTemplate: DEFAULT_TEMPLATE,
      sentLog: {},
      setReminderDays: (reminderDays) => set({ reminderDays: Math.max(1, reminderDays) }),
      setCooldownDays: (cooldownDays) => set({ cooldownDays: Math.max(0, cooldownDays) }),
      setMessageTemplate: (messageTemplate) => set({ messageTemplate }),
      markSent: (transactionId, isoDate) =>
        set((state) => ({
          sentLog: { ...state.sentLog, [transactionId]: isoDate ?? new Date().toISOString() },
        })),
      clearSent: (transactionId) =>
        set((state) => {
          const next = { ...state.sentLog };
          delete next[transactionId];
          return { sentLog: next };
        }),
    }),
    { name: "ledger-reminders" }
  )
);
