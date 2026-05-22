"use server";

import { createClient } from "@/lib/supabase/server";
import { getOpenAIClient, AI_MODEL } from "@/lib/openai";
import { format, startOfDay } from "date-fns";

export async function ensureDailyTip() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !process.env.OPENAI_API_KEY) return null;

  const today = format(startOfDay(new Date()), "yyyy-MM-dd");

  const { data: existing } = await supabase
    .from("ai_recommendations")
    .select("id")
    .eq("user_id", user.id)
    .eq("type", "daily")
    .gte("created_at", `${today}T00:00:00`)
    .limit(1);

  if (existing && existing.length > 0) return null;

  const { data: transactions } = await supabase
    .from("transactions")
    .select("amount, type, description")
    .order("date", { ascending: false })
    .limit(30);

  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: "system",
        content:
          'Дай один короткий финансовый совет на сегодня на русском. JSON: {"title":"...","content":"..."}',
      },
      {
        role: "user",
        content: `Транзакции: ${JSON.stringify(transactions ?? [])}`,
      },
    ],
    temperature: 0.6,
    max_tokens: 200,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let title = "Совет дня";
  let content = "Ведите учёт расходов каждый день.";

  try {
    const parsed = JSON.parse(raw.replace(/```json?\n?|\n?```/g, ""));
    title = parsed.title ?? title;
    content = parsed.content ?? content;
  } catch {
    content = raw.slice(0, 300);
  }

  const { data: inserted } = await supabase
    .from("ai_recommendations")
    .insert({
      user_id: user.id,
      type: "daily",
      title,
      content,
    })
    .select()
    .single();

  return inserted;
}
