import { createClient } from "@/lib/supabase/server";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  eachMonthOfInterval,
} from "date-fns";
import { ru } from "date-fns/locale";
import type { DashboardStats, ChartDataPoint, Transaction } from "@/types";

export async function getTransactions(limit?: number) {
  const supabase = await createClient();
  let query = supabase
    .from("transactions")
    .select("*, category:categories(*)")
    .order("date", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Transaction[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const now = new Date();
  const start = format(startOfMonth(now), "yyyy-MM-dd");
  const end = format(endOfMonth(now), "yyyy-MM-dd");

  const { data } = await supabase
    .from("transactions")
    .select("amount, type")
    .gte("date", start)
    .lte("date", end);

  let income = 0;
  let expense = 0;
  (data ?? []).forEach((t) => {
    const amt = Number(t.amount);
    if (t.type === "income") income += amt;
    else expense += amt;
  });

  const balance = income - expense;
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

  return { balance, income, expense, savingsRate };
}

export async function getChartData(): Promise<ChartDataPoint[]> {
  const supabase = await createClient();
  const now = new Date();
  const months = eachMonthOfInterval({
    start: subMonths(now, 5),
    end: now,
  });

  const results: ChartDataPoint[] = [];

  for (const month of months) {
    const start = format(startOfMonth(month), "yyyy-MM-dd");
    const end = format(endOfMonth(month), "yyyy-MM-dd");

    const { data } = await supabase
      .from("transactions")
      .select("amount, type")
      .gte("date", start)
      .lte("date", end);

    let income = 0;
    let expense = 0;
    (data ?? []).forEach((t) => {
      const amt = Number(t.amount);
      if (t.type === "income") income += amt;
      else expense += amt;
    });

    results.push({
      name: format(month, "LLL", { locale: ru }),
      income,
      expense,
    });
  }

  return results;
}

export async function getCategoryBreakdown() {
  const supabase = await createClient();
  const now = new Date();
  const start = format(startOfMonth(now), "yyyy-MM-dd");

  const { data } = await supabase
    .from("transactions")
    .select("amount, category:categories(name, color)")
    .eq("type", "expense")
    .gte("date", start);

  const map = new Map<string, { value: number; color: string }>();

  (data ?? []).forEach((t) => {
    const raw = t.category as { name: string; color: string } | { name: string; color: string }[] | null;
    const cat = Array.isArray(raw) ? raw[0] : raw;
    const name = cat?.name ?? "Без категории";
    const color = cat?.color ?? "#6b7280";
    const prev = map.get(name) ?? { value: 0, color };
    map.set(name, { value: prev.value + Number(t.amount), color });
  });

  return Array.from(map.entries()).map(([name, { value, color }]) => ({
    name,
    value,
    color,
  }));
}

export async function getCategories(type?: "income" | "expense") {
  const supabase = await createClient();
  let query = supabase.from("categories").select("*").order("name");
  if (type) query = query.eq("type", type);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getAIRecommendations() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_recommendations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

export async function getDailyTip() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_recommendations")
    .select("*")
    .eq("type", "daily")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}
