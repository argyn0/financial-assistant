import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAIClient, AI_MODEL, isAIConfigured } from "@/lib/ai-client";
import { format, startOfMonth, endOfMonth } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message } = await request.json();
    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const start = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const end = format(endOfMonth(new Date()), "yyyy-MM-dd");

    const { data: transactions } = await supabase
      .from("transactions")
      .select("amount, type, description, date, category:categories(name)")
      .gte("date", start)
      .lte("date", end);

    if (!isAIConfigured()) {
      return NextResponse.json({
        reply: "AI-чат недоступен. Настройте GROQ_API_KEY.",
      });
    }

    const context = (transactions ?? [])
      .map((t) => {
        const cat = t.category as { name: string } | { name: string }[] | null;
        const catName = Array.isArray(cat) ? cat[0]?.name : cat?.name;
        return `${t.date}: ${t.type} ${t.amount}₽ — ${t.description ?? ""} [${catName ?? "—"}]`;
      })
      .join("\n");

    const groq = getAIClient();
    const completion = await groq.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: `Ты финансовый помощник. Отвечай кратко на русском, используя данные пользователя.
Транзакции за текущий месяц:\n${context || "Нет транзакций"}`,
        },
        { role: "user", content: message },
      ],
      temperature: 0.4,
      max_tokens: 500,
    });

    const reply = completion.choices[0]?.message?.content ?? "Не удалось получить ответ";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
