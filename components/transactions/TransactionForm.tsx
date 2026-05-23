"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { transactionSchema, type TransactionFormData } from "@/lib/validations";
import { createCategory } from "@/lib/actions/categories";
import type { CategoryFormValues } from "@/lib/schemas/category";
import type { Category } from "@/types";
import { getCategoryIcon } from "@/lib/category-icons";
import { CategoryModal } from "@/components/categories/CategoryModal";
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
import { Switch } from "@/components/ui/switch";
import { useUIStore } from "@/stores/ui-store";

interface TransactionFormProps {
  categories: Category[];
  userId: string;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  onCategoryCreated?: (category: Category) => void;
  loading?: boolean;
  submitLabel?: string;
}

export function TransactionForm({
  categories,
  userId,
  onSubmit,
  onCategoryCreated,
  loading,
  submitLabel = "Сохранить",
}: TransactionFormProps) {
  const [miniModal, setMiniModal] = useState(false);
  const [catLoading, setCatLoading] = useState(false);
  const { showToast } = useUIStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
  const categoryId = watch("category_id");
  const filtered = categories.filter((c) => c.type === type);

  const handleCreateCategory = async (values: CategoryFormValues) => {
    setCatLoading(true);
    const result = await createCategory(userId, { ...values, type });
    setCatLoading(false);
    if (!result.success) {
      showToast(result.error, "error");
      return;
    }
    onCategoryCreated?.(result.data);
    setValue("category_id", result.data.id);
    setMiniModal(false);
    showToast("Категория создана");
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <Input type="number" step="0.01" className="mt-1" {...register("amount")} />
          {errors.amount && (
            <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label>Категория</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setMiniModal(true)}
            >
              <Plus className="h-3 w-3" />
              Создать
            </Button>
          </div>
          <Select
            value={categoryId ?? ""}
            onValueChange={(v) => setValue("category_id", v || null)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Выберите категорию" />
            </SelectTrigger>
            <SelectContent>
              {filtered.map((c) => {
                const Icon = getCategoryIcon(c.icon);
                return (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" style={{ color: c.color }} />
                      {c.name}
                    </span>
                  </SelectItem>
                );
              })}
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
          {errors.date && (
            <p className="text-xs text-destructive mt-1">{errors.date.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="recurring">Периодический платёж</Label>
          <Switch
            id="recurring"
            onCheckedChange={(v) => setValue("is_recurring", v)}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Сохранение..." : submitLabel}
        </Button>
      </form>

      <CategoryModal
        open={miniModal}
        onClose={() => setMiniModal(false)}
        onSubmit={handleCreateCategory}
        defaultType={type}
        loading={catLoading}
      />
    </>
  );
}
