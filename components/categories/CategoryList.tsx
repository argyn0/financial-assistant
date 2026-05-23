"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Pencil, Trash2 } from "lucide-react";
import type { Category } from "@/types";
import { getCategoryIcon } from "@/lib/category-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export function CategoryList({ categories, onEdit, onDelete }: CategoryListProps) {
  const [search, setSearch] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, search]);

  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        Нет категорий. Добавьте первую.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск категорий..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <ul className="space-y-2">
        {filtered.map((cat, i) => {
          const Icon = getCategoryIcon(cat.icon);
          return (
            <motion.li
              key={cat.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className="glass-card rounded-xl p-3 flex items-center gap-3"
            >
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{cat.name}</p>
                <p className="text-xs text-muted-foreground">
                  {cat.is_default ? "Системная" : "Пользовательская"}
                  {cat.budget_limit
                    ? ` · лимит ${cat.budget_limit}₽/${cat.budget_period ?? "мес"}`
                    : ""}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(cat)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                {!cat.is_default && (
                  confirmId === cat.id ? (
                    <div className="flex gap-1">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => {
                          onDelete(cat);
                          setConfirmId(null);
                        }}
                      >
                        Да
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => setConfirmId(null)}
                      >
                        Нет
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("h-8 w-8 text-destructive")}
                      onClick={() => setConfirmId(cat.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )
                )}
              </div>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
