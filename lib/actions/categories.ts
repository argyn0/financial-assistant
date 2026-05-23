"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { categoryFormSchema } from "@/lib/schemas/category";
import { ok, fail, type ActionResult } from "@/lib/types/result";
import type { Category, TransactionType } from "@/types";

const REVALIDATE_PATHS = [
  "/settings",
  "/settings/categories",
  "/add",
  "/transactions",
  "/dashboard",
];

function revalidateAll() {
  REVALIDATE_PATHS.forEach((p) => revalidatePath(p));
}

const DEFAULT_CATEGORIES: Omit<
  Category,
  "id" | "user_id" | "created_at"
>[] = [
  { name: "Продукты", icon: "shopping-cart", color: "#22c55e", type: "expense", is_default: true },
  { name: "Транспорт", icon: "car", color: "#3b82f6", type: "expense", is_default: true },
  { name: "Развлечения", icon: "gamepad-2", color: "#a855f7", type: "expense", is_default: true },
  { name: "Здоровье", icon: "heart-pulse", color: "#ef4444", type: "expense", is_default: true },
  { name: "Жильё", icon: "home", color: "#f59e0b", type: "expense", is_default: true },
  { name: "Подписки", icon: "repeat", color: "#ec4899", type: "expense", is_default: true },
  { name: "Прочее", icon: "tag", color: "#6b7280", type: "expense", is_default: true },
  { name: "Зарплата", icon: "briefcase", color: "#10b981", type: "income", is_default: true },
  { name: "Фриланс", icon: "laptop", color: "#06b6d4", type: "income", is_default: true },
  { name: "Инвестиции", icon: "trending-up", color: "#8b5cf6", type: "income", is_default: true },
  { name: "Прочий доход", icon: "tag", color: "#6b7280", type: "income", is_default: true },
];

export async function getOrCreateDefaults(
  userId: string
): Promise<ActionResult<Category[]>> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (!existing?.length) {
    const rows = DEFAULT_CATEGORIES.map((c) => ({
      user_id: userId,
      name: c.name,
      icon: c.icon,
      color: c.color,
      type: c.type,
      is_default: c.is_default,
    }));

    await supabase.from("categories").insert(rows);
  }

  return getCategories(userId);
}

export async function getCategories(
  userId: string,
  type?: TransactionType
): Promise<ActionResult<Category[]>> {
  const supabase = await createClient();
  let query = supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) return fail(error.message);
  return ok((data ?? []) as Category[]);
}

export async function createCategory(
  userId: string,
  input: unknown
): Promise<ActionResult<Category>> {
  const parsed = categoryFormSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.errors[0]?.message ?? "Некорректные данные");
  }

  const supabase = await createClient();
  const { name, type, icon, color, budget_limit, budget_period } = parsed.data;

  const { data: dup } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .eq("name", name)
    .eq("type", type)
    .maybeSingle();

  if (dup) return fail("Категория с таким названием уже существует");

  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: userId,
      name,
      type,
      icon,
      color,
      is_default: false,
      budget_limit: budget_limit ?? null,
      budget_period: budget_period ?? null,
    })
    .select()
    .single();

  if (error) return fail(error.message);
  revalidateAll();
  return ok(data as Category);
}

export async function updateCategory(
  categoryId: string,
  userId: string,
  input: unknown
): Promise<ActionResult<Category>> {
  const parsed = categoryFormSchema.partial().safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.errors[0]?.message ?? "Некорректные данные");
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("categories")
    .select("*")
    .eq("id", categoryId)
    .eq("user_id", userId)
    .single();

  if (!existing) return fail("Категория не найдена");

  if (parsed.data.name && parsed.data.name !== existing.name) {
    const { data: dup } = await supabase
      .from("categories")
      .select("id")
      .eq("user_id", userId)
      .eq("name", parsed.data.name)
      .eq("type", parsed.data.type ?? existing.type)
      .neq("id", categoryId)
      .maybeSingle();

    if (dup) return fail("Категория с таким названием уже существует");
  }

  const { data, error } = await supabase
    .from("categories")
    .update({
      ...parsed.data,
      budget_limit: parsed.data.budget_limit ?? null,
      budget_period: parsed.data.budget_period ?? null,
    })
    .eq("id", categoryId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return fail(error.message);
  revalidateAll();
  return ok(data as Category);
}

export async function deleteCategory(
  categoryId: string,
  userId: string
): Promise<ActionResult<void>> {
  const supabase = await createClient();

  const { data: cat } = await supabase
    .from("categories")
    .select("is_default, name")
    .eq("id", categoryId)
    .eq("user_id", userId)
    .single();

  if (!cat) return fail("Категория не найдена");
  if (cat.is_default) return fail("Нельзя удалить системную категорию");

  const { count } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId)
    .eq("user_id", userId);

  if (count && count > 0) {
    return fail(
      `В категории «${cat.name}» ${count} операций. Переназначьте их перед удалением.`
    );
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("user_id", userId);

  if (error) return fail(error.message);
  revalidateAll();
  return ok(undefined);
}
