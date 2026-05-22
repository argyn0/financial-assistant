import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAIClient, AI_MODEL, isAIConfigured } from "@/lib/ai-client";
import { categorizeByRules } from "@/lib/categorize";
import type { Category } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transactions } = await request.json();
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ error: "No transactions" }, { status: 400 });
    }

    const { data: categories } = await supabase
      .from("categories")
      .select("*");

    const cats = (categories ?? []) as Category[];
    const results: { index: number; category_id: string | null }[] = [];

    const needsAI: { index: number; description: string; type: string }[] = [];

    transactions.forEach(
      (
        t: { description: string; type: "income" | "expense" },
        index: number
      ) => {
        const ruleMatch = categorizeByRules(t.description, t.type, cats);
        if (ruleMatch) {
          results.push({ index, category_id: ruleMatch.id });
        } else {
          needsAI.push({ index, description: t.description, type: t.type });
        }
      }
    );

    if (needsAI.length > 0 && isAIConfigured()) {
      const groq = getAIClient();
      const batchSize = 20;

      for (let i = 0; i < needsAI.length; i += batchSize) {
        const batch = needsAI.slice(i, i + batchSize);
        const categoryList = cats
          .map((c) => `${c.name} (${c.type}, id:${c.id})`)
          .join(", ");

        const prompt = `Категоризируй транзакции. Доступные категории: ${categoryList}.
Верни JSON массив: [{"index":0,"category_id":"uuid"},...]
Транзакции: ${JSON.stringify(batch)}`;

        const completion = await groq.chat.completions.create({
          model: AI_MODEL,
          messages: [
            {
              role: "system",
              content:
                "Ты финансовый ассистент. Отвечай только валидным JSON без markdown.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
        });

        const content = completion.choices[0]?.message?.content ?? "[]";
        try {
          const parsed = JSON.parse(content.replace(/```json?\n?|\n?```/g, ""));
          if (Array.isArray(parsed)) {
            parsed.forEach((item: { index: number; category_id: string }) => {
              results.push({
                index: batch[item.index]?.index ?? item.index,
                category_id: item.category_id,
              });
            });
          }
        } catch {
          batch.forEach((item) => {
            const fallback = cats.find(
              (c) =>
                c.type === item.type &&
                (c.name === "Прочее" || c.name === "Прочий доход")
            );
            results.push({
              index: item.index,
              category_id: fallback?.id ?? null,
            });
          });
        }
      }
    } else {
      needsAI.forEach((item) => {
        const fallback = cats.find(
          (c) =>
            c.type === (item.type as "income" | "expense") &&
            (c.name === "Прочее" || c.name === "Прочий доход")
        );
        results.push({ index: item.index, category_id: fallback?.id ?? null });
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Categorize error:", error);
    return NextResponse.json(
      { error: "Categorization failed" },
      { status: 500 }
    );
  }
}
