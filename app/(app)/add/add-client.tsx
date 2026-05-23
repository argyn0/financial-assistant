"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TransactionFormData } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { useUIStore } from "@/stores/ui-store";
import type { Category } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { ImportModal } from "@/components/transactions/ImportModal";
import { PenLine, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  categories: Category[];
  userId: string;
}

type Tab = "manual" | "import";

export function AddTransactionClient({ categories: initialCategories, userId }: Props) {
  const [tab, setTab] = useState<Tab>("manual");
  const [categories, setCategories] = useState(initialCategories);
  const [importOpen, setImportOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useUIStore();
  const supabase = createClient();

  const onManualSubmit = async (data: TransactionFormData) => {
    setLoading(true);
    const { error } = await supabase.from("transactions").insert({
      user_id: userId,
      ...data,
      source: "manual",
    });

    setLoading(false);
    if (error) {
      showToast(error.message, "error");
      return;
    }
    showToast("Операция добавлена!");
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Добавить операцию</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ручной ввод или импорт CSV / PDF / OFX
        </p>
      </div>

      <div className="flex gap-2 p-1 glass rounded-xl">
        {(
          [
            { id: "manual" as Tab, label: "Вручную", icon: PenLine },
            { id: "import" as Tab, label: "Импорт", icon: Upload },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => (t.id === "import" ? setImportOpen(true) : setTab(t.id))}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
              tab === t.id && t.id === "manual"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "manual" && (
          <motion.div
            key="manual"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Card glass>
              <CardContent className="p-6">
                <TransactionForm
                  categories={categories}
                  userId={userId}
                  onSubmit={onManualSubmit}
                  onCategoryCreated={(c) =>
                    setCategories((prev) => [...prev, c])
                  }
                  loading={loading}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {tab === "import" && (
        <Card glass>
          <CardContent className="p-8 text-center">
            <Upload className="h-10 w-10 mx-auto text-primary mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Импорт с предпросмотром и AI-категоризацией
            </p>
            <Button onClick={() => setImportOpen(true)}>Открыть импорт</Button>
          </CardContent>
        </Card>
      )}

      <ImportModal
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          setTab("manual");
        }}
        userId={userId}
        categories={categories}
      />
    </div>
  );
}
