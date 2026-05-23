"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseFileBuffer, type ParsedTransaction } from "@/lib/parsers";
import { categorizeDescriptions } from "@/lib/ai/categorize-descriptions";
import { importPreviewSchema, MAX_FILE_SIZE } from "@/lib/schemas/import";
import { ok, fail, type ActionResult } from "@/lib/types/result";
import type { Category } from "@/types";

export async function parseImportFile(
  formData: FormData
): Promise<ActionResult<{ transactions: ParsedTransaction[]; bank?: string; error?: string }>> {
  const file = formData.get("file");
  if (!(file instanceof File)) return fail("Файл не передан");

  if (file.size > MAX_FILE_SIZE) return fail("Файл превышает лимит 10 МБ");

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await parseFileBuffer(buffer, file.name, file.type);

  if (result.error && result.transactions.length === 0) {
    return fail(result.error);
  }

  return ok({
    transactions: result.transactions,
    bank: result.bank,
    error: result.error,
  });
}

export async function categorizePreview(
  transactions: ParsedTransaction[],
  userId: string
): Promise<ActionResult<{ transactions: ParsedTransaction[]; mapping: Record<string, string | null> }>> {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId);

  if (!categories?.length) return fail("Сначала создайте категории");

  const descriptions = Array.from(
    new Set(transactions.map((t) => t.description))
  );
  const mapping = await categorizeDescriptions(descriptions, categories as Category[]);

  const enriched = transactions.map((t) => ({
    ...t,
    category_id: mapping[t.description] ?? t.category_id ?? null,
  }));

  return ok({ transactions: enriched, mapping });
}

export async function confirmImport(
  transactions: ParsedTransaction[],
  userId: string
): Promise<ActionResult<{ count: number }>> {
  const parsed = importPreviewSchema.safeParse(transactions);
  if (!parsed.success) {
    return fail(parsed.error.errors[0]?.message ?? "Некорректные данные импорта");
  }

  const supabase = await createClient();
  const rows = parsed.data.map((t) => ({
    user_id: userId,
    amount: t.amount,
    type: t.type,
    description: t.description,
    date: t.date,
    category_id: t.category_id ?? null,
    currency: t.currency ?? "RUB",
    source: "import" as const,
    tags: [] as string[],
    is_recurring: false,
  }));

  const { error } = await supabase.from("transactions").insert(rows);
  if (error) return fail(error.message);

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/add");

  return ok({ count: rows.length });
}
