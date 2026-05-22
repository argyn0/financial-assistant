"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useHotkey } from "@/hooks/use-hotkey";
import { cn } from "@/lib/utils";

export function FAB() {
  const { toggleQuickAdd, quickAddOpen } = useUIStore();

  useHotkey("mod+n", toggleQuickAdd);

  return (
    <motion.button
      layoutId="fab-button"
      onClick={toggleQuickAdd}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "fixed z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg",
        "bottom-20 right-4 md:bottom-8 md:right-8",
        "will-change-transform transition-shadow hover:shadow-xl"
      )}
      aria-label="Быстрое добавление (Ctrl+N)"
    >
      <motion.div
        animate={{ rotate: quickAddOpen ? 45 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <Plus className="h-6 w-6" />
      </motion.div>
      <span className="sr-only">Быстрое добавление</span>
    </motion.button>
  );
}
