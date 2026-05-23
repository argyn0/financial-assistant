import { getAIClient, AI_MODEL, isAIConfigured } from "@/lib/ai-client";
import { categorizeByRules } from "@/lib/categorize";
import type { Category } from "@/types";

const MAX_BATCHES = 3;
const BATCH_SIZE = 15;

export async function categorizeDescriptions(
  descriptions: string[],
  categories: Category[]
): Promise<Record<string, string | null>> {
  const mapping: Record<string, string | null> = {};
  const needsAI: string[] = [];

  for (const desc of descriptions) {
    const expenseCat = categories.filter((c) => c.type === "expense");
    const incomeCat = categories.filter((c) => c.type === "income");
    const rule =
      categorizeByRules(desc, "expense", expenseCat) ??
      categorizeByRules(desc, "income", incomeCat);

    if (rule) mapping[desc] = rule.id;
    else needsAI.push(desc);
  }

  if (!needsAI.length || !isAIConfigured()) {
    const fallback = categories.find((c) => c.name === "Прочее" || c.name === "Прочий доход");
    needsAI.forEach((d) => {
      if (!mapping[d]) mapping[d] = fallback?.id ?? null;
    });
    return mapping;
  }

  const groq = getAIClient();
  const unique = Array.from(new Set(needsAI));
  let batchCount = 0;

  for (let i = 0; i < unique.length && batchCount < MAX_BATCHES; i += BATCH_SIZE) {
    batchCount++;
    const batch = unique.slice(i, i + BATCH_SIZE);
    const categoryList = categories
      .map((c) => `${c.name} (${c.type}, id:${c.id})`)
      .join(", ");

    try {
      const completion = await groq.chat.completions.create({
        model: AI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "Ты финансовый ассистент. Отвечай только JSON: {\"mappings\":[{\"description\":\"...\",\"category_id\":\"uuid\"}]}",
          },
          {
            role: "user",
            content: `Категории: ${categoryList}. Описания: ${JSON.stringify(batch)}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 800,
      });

      const content = completion.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(content.replace(/```json?\n?|\n?```/g, "")) as {
        mappings?: { description: string; category_id: string }[];
      };

      parsed.mappings?.forEach((m) => {
        mapping[m.description] = m.category_id;
      });
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 429) break;
    }
  }

  const fallback = categories.find((c) => c.name === "Прочее" || c.name === "Прочий доход");
  unique.forEach((d) => {
    if (!mapping[d]) mapping[d] = fallback?.id ?? null;
  });

  return mapping;
}
