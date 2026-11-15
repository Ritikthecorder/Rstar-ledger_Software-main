import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Settings } from "@/types/database";

interface SettingsState {
  settings: Settings | null;
  setSettings: (settings: Settings | null) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: null,
      setSettings: (settings) => set({ settings }),
    }),
    { name: "ledger-settings" }
  )
);
