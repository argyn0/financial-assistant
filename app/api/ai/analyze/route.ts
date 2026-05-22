import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAIClient, AI_MODEL, isAIConfigured } from "@/lib/ai-client";
import { format, subDays } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type = "weekly" } = body;

    const since = format(subDays(new Date(), type === "weekly" ? 30 : 7), "yyyy-MM-dd");

    const { data: transactions } = await supabase
      .from("transactions")
      .select("amount, type, description, date, is_recurring, category:categories(name)")
      .gte("date", since)
      .order("date", { ascending: false });

    if (!transactions?.length) {
      return NextResponse.json({
        recommendations: [
          {
            type: "insight",
            title: "Начните учёт",
            content: "Добавьте первые транзакции, чтобы получить персональные рекомендации.",
          },
        ],
      });
    }

    if (!isAIConfigured()) {
      return NextResponse.json({
        recommendations: [
          {
            type: "insight",
            title: "AI недоступен",
            content: "Добавьте GROQ_API_KEY для персонального анализа.",
          },
        ],
      });
    }

    const summary = transactions.map((t) => {
      const cat = t.category as { name: string } | { name: string }[] | null;
      const catName = Array.isArray(cat) ? cat[0]?.name : cat?.name;
      return {
        amount: t.amount,
        type: t.type,
        desc: t.description,
        date: t.date,
        recurring: t.is_recurring,
        cat: catName,
      };
    });

    const groq = getAIClient();
    const completion = await groq.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: `Ты финансовый консультант. Анализируй транзакции на русском языке.
Верни JSON: {"recommendations":[{"type":"weekly|insight|anomaly","title":"...","content":"..."}]}
Найди: аномалии, скрытые подписки, импульсивные траты, советы по бюджету. 3-5 рекомендаций.`,
        },
        {
          role: "user",
          content: `Транзакции за период: ${JSON.stringify(summary)}`,
        },
      ],
      temperature: 0.5,
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    let parsed: { recommendations: { type: string; title: string; content: string }[] };

    try {
      parsed = JSON.parse(content.replace(/```json?\n?|\n?```/g, ""));
    } catch {
      parsed = {
        recommendations: [
          {
            type: "insight",
            title: "Анализ завершён",
            content: content.slice(0, 500),
          },
        ],
      };
    }

    for (const rec of parsed.recommendations ?? []) {
      await supabase.from("ai_recommendations").insert({
        user_id: user.id,
        type: rec.type || "insight",
        title: rec.title,
        content: rec.content,
      });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
