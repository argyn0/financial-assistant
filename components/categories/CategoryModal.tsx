"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  categoryFormSchema,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  BUDGET_PERIODS,
  type CategoryFormValues,
} from "@/lib/schemas/category";
import { getCategoryIcon } from "@/lib/category-icons";
import type { Category } from "@/types";
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
import { cn } from "@/lib/utils";

interface CategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CategoryFormValues) => Promise<void>;
  initial?: Category | null;
  defaultType?: "income" | "expense";
  loading?: boolean;
}

export function CategoryModal({
  open,
  onClose,
  onSubmit,
  initial,
  defaultType = "expense",
  loading,
}: CategoryModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      type: defaultType,
      icon: "tag",
      color: "#6366f1",
      budget_limit: null,
      budget_period: null,
    },
  });

  const icon = watch("icon");
  const color = watch("color");
  const type = watch("type");

  useEffect(() => {
    if (initial) {
      reset({
        name: initial.name,
        type: initial.type,
        icon: initial.icon,
        color: initial.color,
        budget_limit: initial.budget_limit ?? null,
        budget_period: initial.budget_period ?? null,
      });
    } else {
      reset({
        name: "",
        type: defaultType,
        icon: "tag",
        color: "#6366f1",
        budget_limit: null,
        budget_period: null,
      });
    }
  }, [initial, defaultType, reset, open]);

  if (!open) return null;

  const IconPreview = getCategoryIcon(icon);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="w-full max-w-md glass-card rounded-2xl p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-bold mb-4">
            {initial ? "Редактировать категорию" : "Новая категория"}
          </h2>

          <form
            onSubmit={handleSubmit(async (data) => {
              await onSubmit(data);
            })}
            className="space-y-4"
          >
            <div>
              <Label>Название</Label>
              <Input className="mt-1" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label>Тип</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  type="button"
                  variant={type === "expense" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setValue("type", "expense")}
                  disabled={!!initial?.is_default}
                >
                  Расход
                </Button>
                <Button
                  type="button"
                  variant={type === "income" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setValue("type", "income")}
                  disabled={!!initial?.is_default}
                >
                  Доход
                </Button>
              </div>
            </div>

            <div>
              <Label>Иконка</Label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {CATEGORY_ICONS.map((name) => {
                  const Ic = getCategoryIcon(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setValue("icon", name)}
                      className={cn(
                        "h-10 rounded-lg flex items-center justify-center border transition-colors",
                        icon === name
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-accent"
                      )}
                    >
                      <Ic className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label>Цвет</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {CATEGORY_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setValue("color", c)}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-transform",
                      color === c ? "scale-110 border-foreground" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${color}25`, color }}
              >
                <IconPreview className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">{watch("name") || "Превью"}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Лимит бюджета</Label>
                <Input
                  type="number"
                  className="mt-1"
                  placeholder="Не задан"
                  {...register("budget_limit")}
                />
              </div>
              <div>
                <Label>Период</Label>
                <Select
                  value={watch("budget_period") ?? "none"}
                  onValueChange={(v) =>
                    setValue("budget_period", v === "none" ? null : (v as CategoryFormValues["budget_period"]))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {BUDGET_PERIODS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Отмена
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
