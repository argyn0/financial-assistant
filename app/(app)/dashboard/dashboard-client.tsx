"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseChart } from "@/components/charts/expense-chart";
import { CategoryPie } from "@/components/charts/category-pie";
import { Sparkles, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import type {
  DashboardStats,
  ChartDataPoint,
  Transaction,
  AIRecommendation,
} from "@/types";

interface Props {
  stats: DashboardStats;
  chartData: ChartDataPoint[];
  categories: { name: string; value: number; color: string }[];
  tip: AIRecommendation | null;
  recent: Transaction[];
}

export function DashboardClient({
  stats,
  chartData,
  categories,
  tip,
  recent,
}: Props) {
  const statCards = [
    {
      label: "Баланс",
      value: formatCurrency(stats.balance),
      icon: Wallet,
      color: "text-primary",
    },
    {
      label: "Доходы",
      value: formatCurrency(stats.income),
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      label: "Расходы",
      value: formatCurrency(stats.expense),
      icon: TrendingDown,
      color: "text-red-500",
    },
    {
      label: "Норма сбережений",
      value: `${stats.savingsRate.toFixed(0)}%`,
      icon: Sparkles,
      color: "text-amber-500",
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card glass className="overflow-hidden">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {s.label}
                  </p>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <p className="text-lg md:text-2xl font-bold mt-2">{s.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {tip && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-xl p-4 border-l-4 border-l-primary"
        >
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">{tip.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{tip.content}</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <Card glass className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Динамика за 6 месяцев</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseChart data={chartData} />
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader>
            <CardTitle>Расходы по категориям</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPie data={categories} />
          </CardContent>
        </Card>
      </div>

      <Card glass>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Последние операции</CardTitle>
          <Link
            href="/transactions"
            className="text-sm text-primary hover:underline"
          >
            Все →
          </Link>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Пока нет операций.{" "}
              <Link href="/add" className="text-primary hover:underline">
                Добавить первую
              </Link>
            </p>
          ) : (
            <ul className="space-y-3">
              {recent.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {t.description || t.category?.name || "Операция"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatShortDate(t.date)}
                    </p>
                  </div>
                  <span
                    className={`font-semibold text-sm ${
                      t.type === "income" ? "text-green-500" : "text-foreground"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {formatCurrency(Number(t.amount))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
