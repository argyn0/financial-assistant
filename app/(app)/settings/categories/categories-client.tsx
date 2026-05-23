"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Plus } from "lucide-react";
import type { Category } from "@/types";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/actions/categories";
import type { CategoryFormValues } from "@/lib/schemas/category";
import { CategoryModal } from "@/components/categories/CategoryModal";
import { CategoryList } from "@/components/categories/CategoryList";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

interface Props {
  initialCategories: Category[];
  userId: string;
}

type Tab = "expense" | "income";

export function CategoriesPageClient({ initialCategories, userId }: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [tab, setTab] = useState<Tab>("expense");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useUIStore();

  const filtered = categories.filter((c) => c.type === tab);

  const handleSave = async (values: CategoryFormValues) => {
    setLoading(true);
    const result = editing
      ? await updateCategory(editing.id, userId, values)
      : await createCategory(userId, values);
    setLoading(false);

    if (!result.success) {
      showToast(result.error, "error");
      return;
    }

    if (editing) {
      setCategories((prev) =>
        prev.map((c) => (c.id === editing.id ? result.data : c))
      );
    } else {
      setCategories((prev) => [...prev, result.data]);
    }

    showToast(editing ? "Категория обновлена" : "Категория создана");
    setModalOpen(false);
    setEditing(null);
  };

  const handleDelete = async (cat: Category) => {
    const result = await deleteCategory(cat.id, userId);
    if (!result.success) {
      showToast(result.error, "error");
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    showToast("Категория удалена");
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Категории</h1>
          <p className="text-sm text-muted-foreground">
            Управление категориями доходов и расходов
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Добавить
        </Button>
      </div>

      <div className="flex gap-2 p-1 glass rounded-xl">
        {(["expense", "income"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors",
              tab === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            )}
          >
            {t === "expense" ? "Расходы" : "Доходы"}
          </button>
        ))}
      </div>

      <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <CategoryList
          categories={filtered}
          onEdit={(cat) => {
            setEditing(cat);
            setModalOpen(true);
          }}
          onDelete={handleDelete}
        />
      </motion.div>

      <CategoryModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSave}
        initial={editing}
        defaultType={tab}
        loading={loading}
      />
    </div>
  );
}
