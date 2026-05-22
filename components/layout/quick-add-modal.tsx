"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUIStore } from "@/stores/ui-store";
import { quickAddSchema, type QuickAddFormData } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/types";

export function QuickAddModal() {
  const { quickAddOpen, setQuickAddOpen, showToast } = useUIStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<QuickAddFormData>({
    resolver: zodResolver(quickAddSchema),
    defaultValues: { type: "expense" },
  });

  const type = watch("type");

  useEffect(() => {
    if (!quickAddOpen) return;
    supabase
      .from("categories")
      .select("*")
      .eq("type", type)
      .then(({ data }) => setCategories(data ?? []));
  }, [quickAddOpen, type, supabase]);

  const onSubmit = async (data: QuickAddFormData) => {
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
      amount: data.amount,
      type: data.type,
      category_id: data.category_id,
      date: new Date().toISOString().split("T")[0],
      currency: "RUB",
    });

    setLoading(false);
    if (error) {
      showToast(error.message, "error");
      return;
    }

    showToast("Операция добавлена!");
    reset();
    setQuickAddOpen(false);
  };

  return (
    <AnimatePresence>
      {quickAddOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={() => setQuickAddOpen(false)}
          />
          <motion.div
            layoutId="fab-button"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed z-[70] left-4 right-4 bottom-24 md:left-auto md:right-8 md:bottom-24 md:w-96 glass-card rounded-2xl p-5 shadow-2xl"
          >
            <h3 className="font-semibold text-lg mb-4">Быстрое добавление</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={type === "expense" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setValue("type", "expense")}
                >
                  Расход
                </Button>
                <Button
                  type="button"
                  variant={type === "income" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setValue("type", "income")}
                >
                  Доход
                </Button>
              </div>

              <div>
                <Label htmlFor="amount">Сумма (₽)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0"
                  className="mt-1 text-xl font-semibold"
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
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category_id && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.category_id.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Сохранение..." : "Сохранить"}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground text-center mt-3">
              ⌘/Ctrl + N — быстрый вызов
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
