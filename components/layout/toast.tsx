"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/stores/ui-store";
import { useEffect } from "react";
import { CheckCircle, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toast() {
  const { toast, hideToast } = useUIStore();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(hideToast, 4000);
    return () => clearTimeout(t);
  }, [toast, hideToast]);

  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
  };

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-24 left-1/2 z-[100] -translate-x-1/2 md:bottom-8"
        >
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg glass-card",
              toast.type === "success" && "border-green-500/30",
              toast.type === "error" && "border-red-500/30"
            )}
          >
            {(() => {
              const Icon = icons[toast.type];
              return (
                <Icon
                  className={cn(
                    "h-5 w-5",
                    toast.type === "success" && "text-green-500",
                    toast.type === "error" && "text-red-500",
                    toast.type === "info" && "text-primary"
                  )}
                />
              );
            })()}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
