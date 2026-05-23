"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, FileText, Sparkles } from "lucide-react";
import type { ParsedTransaction } from "@/lib/parsers/types";
import type { Category } from "@/types";
import {
  parseImportFile,
  categorizePreview,
  confirmImport,
} from "@/lib/actions/import";
import { getCategoryIcon } from "@/lib/category-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  categories: Category[];
}

type Step = "upload" | "preview" | "categorizing";

export function ImportModal({
  open,
  onClose,
  userId,
  categories,
}: ImportModalProps) {
  const [step, setStep] = useState<Step>("upload");
  const [progress, setProgress] = useState(0);
  const [rows, setRows] = useState<ParsedTransaction[]>([]);
  const [parseWarning, setParseWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useUIStore();

  const reset = () => {
    setStep("upload");
    setProgress(0);
    setRows([]);
    setParseWarning(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const processFile = useCallback(
    async (file: File) => {
      setLoading(true);
      setProgress(20);
      const formData = new FormData();
      formData.append("file", file);

      const parseResult = await parseImportFile(formData);
      setProgress(50);

      if (!parseResult.success) {
        showToast(parseResult.error, "error");
        setLoading(false);
        setProgress(0);
        return;
      }

      if (parseResult.data.error) {
        setParseWarning(parseResult.data.error);
      }

      setStep("categorizing");
      setProgress(70);

      const catResult = await categorizePreview(
        parseResult.data.transactions,
        userId
      );
      setProgress(100);

      if (!catResult.success) {
        showToast(catResult.error, "error");
        setRows(parseResult.data.transactions);
      } else {
        setRows(catResult.data.transactions);
      }

      setStep("preview");
      setLoading(false);
    },
    [userId, showToast]
  );

  const updateRow = (index: number, patch: Partial<ParsedTransaction>) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r))
    );
  };

  const handleImport = async () => {
    if (!rows.length) return;
    setLoading(true);
    const result = await confirmImport(rows, userId);
    setLoading(false);

    if (!result.success) {
      showToast(result.error, "error");
      return;
    }

    showToast(`Импортировано ${result.data.count} операций`);
    handleClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className={cn(
            "w-full sm:max-w-2xl glass-card sm:rounded-2xl shadow-2xl",
            "max-h-[90vh] flex flex-col"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Импорт выписки
            </h2>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            {step === "upload" && (
              <>
                <label
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
                    "border-border hover:bg-accent/30",
                    loading && "pointer-events-none opacity-60"
                  )}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) processFile(file);
                  }}
                >
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium">CSV, PDF или OFX</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Перетащите или выберите · до 10 МБ
                  </span>
                  <input
                    type="file"
                    accept=".csv,.pdf,.ofx,.qfx,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) processFile(file);
                    }}
                  />
                </label>
                {loading && (
                  <div>
                    <Progress value={progress} />
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Парсинг и AI-категоризация...
                    </p>
                  </div>
                )}
              </>
            )}

            {step === "categorizing" && (
              <div className="space-y-3 py-8">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <p className="text-sm text-center text-muted-foreground flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  AI-категоризация...
                </p>
              </div>
            )}

            {step === "preview" && (
              <>
                {parseWarning && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-lg p-3">
                    {parseWarning}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Найдено {rows.length} операций. Проверьте и отредактируйте перед импортом.
                </p>
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {rows.map((row, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-lg bg-muted/30 text-sm"
                    >
                      <Input
                        type="date"
                        className="sm:col-span-2 h-9"
                        value={row.date}
                        onChange={(e) => updateRow(i, { date: e.target.value })}
                      />
                      <Input
                        type="number"
                        className="sm:col-span-2 h-9"
                        value={row.amount}
                        onChange={(e) =>
                          updateRow(i, { amount: parseFloat(e.target.value) || 0 })
                        }
                      />
                      <Input
                        className="sm:col-span-4 h-9"
                        value={row.description}
                        onChange={(e) =>
                          updateRow(i, { description: e.target.value })
                        }
                      />
                      <Select
                        value={row.category_id ?? ""}
                        onValueChange={(v) => updateRow(i, { category_id: v || null })}
                      >
                        <SelectTrigger className="sm:col-span-4 h-9">
                          <SelectValue placeholder="Категория" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories
                            .filter((c) => c.type === row.type)
                            .map((c) => {
                              const Icon = getCategoryIcon(c.icon);
                              return (
                                <SelectItem key={c.id} value={c.id}>
                                  <span className="flex items-center gap-2">
                                    <Icon className="h-3 w-3" style={{ color: c.color }} />
                                    {c.name}
                                  </span>
                                </SelectItem>
                              );
                            })}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {step === "preview" && (
            <div className="p-4 border-t border-border/50">
              <Button
                className="w-full"
                onClick={handleImport}
                disabled={loading || rows.length === 0}
              >
                {loading
                  ? "Импорт..."
                  : `Импортировать ${rows.length} записей`}
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
