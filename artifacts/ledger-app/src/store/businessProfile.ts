import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BusinessProfileState {
  description: string;
  watermarkDataUrl: string | null;
  geminiApiKey: string;
  setDescription: (desc: string) => void;
  setWatermark: (dataUrl: string | null) => void;
  setGeminiApiKey: (key: string) => void;
}

export const useBusinessProfileStore = create<BusinessProfileState>()(
  persist(
    (set) => ({
      description: "",
      watermarkDataUrl: null,
      geminiApiKey: "",
      setDescription: (description) => set({ description }),
      setWatermark: (watermarkDataUrl) => set({ watermarkDataUrl }),
      setGeminiApiKey: (geminiApiKey) => set({ geminiApiKey }),
    }),
    { name: "ledger-business-profile" }
  )
);
