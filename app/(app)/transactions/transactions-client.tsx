"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import type { Transaction } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Trash2, CheckSquare } from "lucide-react";
import * as Checkbox from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  initialTransactions: Transaction[];
}

export function TransactionsClient({ initialTransactions }: Props) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { showToast } = useUIStore();
  const supabase = createClient();

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        !search ||
        t.description?.toLowerCase().includes(search.toLowerCase()) ||
        t.category?.name?.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || t.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [transactions, search, typeFilter]);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((t) => t.id)));
    }
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    const { error } = await supabase
      .from("transactions")
      .delete()
      .in("id", Array.from(selected));

    if (error) {
      showToast(error.message, "error");
      return;
    }

    setTransactions((prev) => prev.filter((t) => !selected.has(t.id)));
    setSelected(new Set());
    showToast(`Удалено ${selected.size} операций`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Операции</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {filtered.length} из {transactions.length}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="income">Доходы</SelectItem>
            <SelectItem value="expense">Расходы</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selected.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 glass-card rounded-lg p-3"
        >
          <span className="text-sm">Выбрано: {selected.size}</span>
          <Button variant="destructive" size="sm" onClick={deleteSelected}>
            <Trash2 className="h-4 w-4" />
            Удалить
          </Button>
        </motion.div>
      )}

      {filtered.length === 0 ? (
        <Card glass>
          <CardContent className="py-16 text-center text-muted-foreground">
            {transactions.length === 0
              ? "Нет операций. Добавьте первую!"
              : "Ничего не найдено"}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <button
            onClick={selectAll}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <CheckSquare className="h-4 w-4" />
            {selected.size === filtered.length ? "Снять выделение" : "Выбрать все"}
          </button>

          {filtered.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <Card
                glass
                className={cn(
                  "transition-colors",
                  selected.has(t.id) && "ring-2 ring-primary"
                )}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <Checkbox.Root
                    checked={selected.has(t.id)}
                    onCheckedChange={() => toggleSelect(t.id)}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  >
                    <Checkbox.Indicator>
                      <Check className="h-3 w-3" />
                    </Checkbox.Indicator>
                  </Checkbox.Root>

                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      backgroundColor: `${t.category?.color ?? "#6b7280"}20`,
                      color: t.category?.color ?? "#6b7280",
                    }}
                  >
                    {t.category?.name?.slice(0, 2) ?? "—"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {t.description || t.category?.name || "Операция"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatShortDate(t.date)}
                      {t.is_recurring && " · Подписка"}
                    </p>
                  </div>

                  <span
                    className={cn(
                      "font-semibold text-sm shrink-0",
                      t.type === "income" ? "text-green-500" : ""
                    )}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {formatCurrency(Number(t.amount))}
                  </span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
