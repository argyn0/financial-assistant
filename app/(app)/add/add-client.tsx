"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { transactionSchema, type TransactionFormData } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { parseStatementFile } from "@/utils/parse-statement";
import { useUIStore } from "@/stores/ui-store";
import type { Category, ParsedTransaction } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload, PenLine, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  categories: Category[];
}

type Tab = "manual" | "import";

export function AddTransactionClient({ categories }: Props) {
  const [tab, setTab] = useState<Tab>("manual");
  const [loading, setLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [preview, setPreview] = useState<
    (ParsedTransaction & { category_id?: string | null })[]
  >([]);
  const [importError, setImportError] = useState<string | null>(null);
  const { showToast } = useUIStore();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "expense",
      currency: "RUB",
      date: new Date().toISOString().split("T")[0],
      is_recurring: false,
      tags: [],
    },
  });

  const type = watch("type");
  const filteredCategories = categories.filter((c) => c.type === type);

  const onManualSubmit = async (data: TransactionFormData) => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      showToast("Войдите в аккаунт", "error");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      ...data,
    });

    setLoading(false);
    if (error) {
      showToast(error.message, "error");
      return;
    }

    showToast("Операция добавлена!");
    reset();
  };

  const handleFileUpload = useCallback(
    async (file: File) => {
      setImportError(null);
      setPreview([]);
      setImportProgress(10);

      try {
        const content = await file.text();
        setImportProgress(30);
        const parsed = parseStatementFile(content, file.name);
        setImportProgress(50);

        const categorizeRes = await fetch("/api/ai/categorize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactions: parsed.map((t) => ({
              description: t.description,
              type: t.type,
            })),
          }),
        });

        setImportProgress(75);
        const { results } = await categorizeRes.json();

        const withCategories = parsed.map((t, i) => ({
          ...t,
          category_id:
            results?.find((r: { index: number }) => r.index === i)?.category_id ??
            null,
        }));

        setPreview(withCategories);
        setImportProgress(100);
      } catch (e) {
        setImportError(
          e instanceof Error ? e.message : "Ошибка парсинга файла"
        );
        setImportProgress(0);
      }
    },
    []
  );

  const saveImported = async () => {
    if (preview.length === 0) return;
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      showToast("Войдите в аккаунт", "error");
      setLoading(false);
      return;
    }

    const rows = preview.map((t) => ({
      user_id: user.id,
      amount: t.amount,
      type: t.type,
      description: t.description,
      date: t.date,
      category_id: t.category_id,
      currency: "RUB",
    }));

    const { error } = await supabase.from("transactions").insert(rows);
    setLoading(false);

    if (error) {
      showToast(error.message, "error");
      return;
    }

    showToast(`Импортировано ${rows.length} операций!`);
    setPreview([]);
    setImportProgress(0);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Добавить операцию</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ручной ввод или загрузка выписки
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
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
              tab === t.id
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
        {tab === "manual" ? (
          <motion.div
            key="manual"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Card glass>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit(onManualSubmit)} className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={type === "expense" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setValue("type", "expense")}
                    >
                      Расход
                    </Button>
                    <Button
                      type="button"
                      variant={type === "income" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setValue("type", "income")}
                    >
                      Доход
                    </Button>
                  </div>

                  <div>
                    <Label>Сумма (₽)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      className="mt-1"
                      {...register("amount")}
                    />
                    {errors.amount && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.amount.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Категория</Label>
                    <Select onValueChange={(v) => setValue("category_id", v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Выберите" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Описание</Label>
                    <Input className="mt-1" {...register("description")} />
                  </div>

                  <div>
                    <Label>Дата</Label>
                    <Input type="date" className="mt-1" {...register("date")} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="recurring">Периодический платёж</Label>
                    <Switch
                      id="recurring"
                      onCheckedChange={(v) => setValue("is_recurring", v)}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Сохранение..." : "Сохранить"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="import"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <Card glass>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Загрузка выписки (CSV / OFX)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-accent/30 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Перетащите или выберите файл
                  </span>
                  <input
                    type="file"
                    accept=".csv,.ofx,.qfx,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                </label>

                {importProgress > 0 && importProgress < 100 && (
                  <div className="mt-4">
                    <Progress value={importProgress} />
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      Обработка...
                    </p>
                  </div>
                )}

                {importError && (
                  <p className="text-sm text-destructive mt-3 p-3 bg-destructive/10 rounded-lg">
                    {importError}
                  </p>
                )}
              </CardContent>
            </Card>

            {preview.length > 0 && (
              <Card glass>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">
                    Предпросмотр ({preview.length})
                  </CardTitle>
                  <Button onClick={saveImported} disabled={loading} size="sm">
                    Сохранить все
                  </Button>
                </CardHeader>
                <CardContent className="max-h-64 overflow-y-auto space-y-2">
                  {preview.slice(0, 20).map((t, i) => (
                    <div
                      key={i}
                      className="flex justify-between text-sm py-2 border-b border-border/50"
                    >
                      <span className="truncate flex-1">{t.description}</span>
                      <span className="font-medium ml-2">
                        {t.type === "income" ? "+" : "-"}
                        {t.amount}₽
                      </span>
                    </div>
                  ))}
                  {preview.length > 20 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      и ещё {preview.length - 20}...
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
