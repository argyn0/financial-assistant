"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Upload,
  Shield,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: TrendingUp,
    title: "Умная аналитика",
    desc: "Графики, баланс и AI-советы каждый день",
  },
  {
    icon: Upload,
    title: "Импорт выписок",
    desc: "CSV и OFX с автокатегоризацией",
  },
  {
    icon: Sparkles,
    title: "AI-помощник",
    desc: "Находит подписки и аномальные траты",
  },
  {
    icon: Zap,
    title: "Быстрый ввод",
    desc: "FAB + Ctrl+N для мгновенной записи",
  },
];

export default function LandingPage() {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/20" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

      <header className="relative z-10 flex items-center justify-between p-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="font-bold text-xl">ФинПомощник</span>
        </div>
        <Button
          variant="glass"
          size="sm"
          onClick={() =>
            setAuthMode(authMode === "login" ? "register" : "login")
          }
        >
          {authMode === "login" ? "Регистрация" : "Вход"}
        </Button>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>AI-powered финансы</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Ваши финансы
              <span className="text-primary"> под контролем</span>
            </h1>

            <p className="mt-4 text-lg text-muted-foreground max-w-lg">
              Учёт доходов и расходов, импорт банковских выписок,
              персональные рекомендации и быстрый ввод — всё в одном приложении.
            </p>

            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="glass-card rounded-xl p-4 hover:shadow-lg transition-shadow"
                >
                  <f.icon className="h-5 w-5 text-primary mb-2" />
                  <h3 className="font-semibold text-sm">{f.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Данные защищены RLS в Supabase</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center"
          >
            <AuthForm
              mode={authMode}
              onToggle={() =>
                setAuthMode(authMode === "login" ? "register" : "login")
              }
            />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
