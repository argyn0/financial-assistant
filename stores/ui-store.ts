import { create } from "zustand";

interface UIStore {
  quickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
  toggleQuickAdd: () => void;
  toast: { message: string; type: "success" | "error" | "info" } | null;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  hideToast: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  quickAddOpen: false,
  setQuickAddOpen: (open) => set({ quickAddOpen: open }),
  toggleQuickAdd: () =>
    set((s) => ({ quickAddOpen: !s.quickAddOpen })),
  toast: null,
  showToast: (message, type = "success") => set({ toast: { message, type } }),
  hideToast: () => set({ toast: null }),
}));
