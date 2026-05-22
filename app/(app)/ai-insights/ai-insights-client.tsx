"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { AIRecommendation } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  AlertTriangle,
  Lightbulb,
  MessageCircle,
  RefreshCw,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  initialRecommendations: AIRecommendation[];
}

const typeIcons = {
  daily: Lightbulb,
  weekly: Sparkles,
  insight: MessageCircle,
  anomaly: AlertTriangle,
};

export function AIInsightsClient({ initialRecommendations }: Props) {
  const [recommendations, setRecommendations] =
    useState(initialRecommendations);
  const [analyzing, setAnalyzing] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [chatLoading, setChatLoading] = useState(false);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "weekly" }),
      });
      const data = await res.json();
      if (data.recommendations) {
        setRecommendations((prev) => [
          ...data.recommendations.map(
            (
              r: { type: string; title: string; content: string },
              i: number
            ) => ({
              id: `new-${Date.now()}-${i}`,
              user_id: "",
              type: r.type as AIRecommendation["type"],
              title: r.title,
              content: r.content,
              metadata: {},
              is_read: false,
              created_at: new Date().toISOString(),
            })
          ),
          ...prev,
        ]);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const sendChat = async () => {
    if (!chatMessage.trim()) return;
    const msg = chatMessage;
    setChatMessage("");
    setChatHistory((prev) => [...prev, { role: "user", content: msg }]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: data.reply ?? "Ошибка ответа" },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" />
            AI-аналитика
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Персональные рекомендации и чат-помощник
          </p>
        </div>
        <Button onClick={runAnalysis} disabled={analyzing}>
          <RefreshCw
            className={cn("h-4 w-4", analyzing && "animate-spin")}
          />
          {analyzing ? "Анализ..." : "Запустить анализ"}
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="font-semibold">Рекомендации</h2>
          {recommendations.length === 0 ? (
            <Card glass>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>Запустите анализ для получения рекомендаций</p>
              </CardContent>
            </Card>
          ) : (
            recommendations.map((rec, i) => {
              const Icon = typeIcons[rec.type] ?? Lightbulb;
              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card glass>
                    <CardContent className="p-4 flex gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{rec.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {rec.content}
                        </p>
                        <span className="text-xs text-muted-foreground mt-2 inline-block capitalize">
                          {rec.type}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        <Card glass className="flex flex-col h-[500px]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Чат с AI
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {chatHistory.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Спросите: «Сколько я потратил на еду в этом месяце?»
                </p>
              )}
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm max-w-[85%]",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-muted"
                  )}
                >
                  {msg.content}
                </div>
              ))}
              {chatLoading && (
                <div className="bg-muted rounded-lg px-3 py-2 text-sm animate-pulse">
                  Думаю...
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ваш вопрос..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
              />
              <Button size="icon" onClick={sendChat} disabled={chatLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
