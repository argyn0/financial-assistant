"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/hooks/use-theme";
import { useUIStore } from "@/stores/ui-store";
import type { Category, Profile } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Palette,
  Tags,
  Download,
  Trash2,
  LogOut,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";

interface Props {
  profile: Profile | null;
  categories: Category[];
  userEmail: string;
}

export function SettingsClient({ profile, categories, userEmail }: Props) {
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [currency, setCurrency] = useState(profile?.default_currency ?? "RUB");
  const [saving, setSaving] = useState(false);
  const { theme, setTheme } = useTheme();
  const { showToast } = useUIStore();
  const router = useRouter();
  const supabase = createClient();

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, default_currency: currency })
      .eq("id", profile?.id ?? "");

    setSaving(false);
    if (error) showToast(error.message, "error");
    else showToast("Профиль сохранён");
  };

  const exportData = async () => {
    const { data } = await supabase
      .from("transactions")
      .select("*, category:categories(name)")
      .order("date", { ascending: false });

    const csv = [
      "date,type,amount,currency,description,category",
      ...(data ?? []).map((t) => {
        const raw = t.category as
          | { name: string }
          | { name: string }[]
          | null;
        const catName = Array.isArray(raw) ? raw[0]?.name : raw?.name;
        return `${t.date},${t.type},${t.amount},${t.currency},"${(t.description ?? "").replace(/"/g, '""')}",${catName ?? ""}`;
      }),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    showToast("Экспорт завершён");
  };

  const deleteAccount = async () => {
    if (
      !confirm(
        "Удалить аккаунт и все данные? Это действие необратимо."
      )
    )
      return;

    await supabase.from("transactions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.auth.signOut();
    router.push("/");
    showToast("Аккаунт удалён", "info");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Настройки</h1>
        <p className="text-muted-foreground text-sm mt-1">{userEmail}</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card glass>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-5 w-5" />
              Профиль
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Имя</Label>
              <Input
                className="mt-1"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <Label>Валюта по умолчанию</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RUB">₽ RUB</SelectItem>
                  <SelectItem value="USD">$ USD</SelectItem>
                  <SelectItem value="EUR">€ EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={saveProfile} disabled={saving}>
              {saving ? "Сохранение..." : "Сохранить"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <Card glass>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Тема
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {(
              [
                { value: "light" as const, icon: Sun, label: "Светлая" },
                { value: "dark" as const, icon: Moon, label: "Тёмная" },
                { value: "system" as const, icon: Monitor, label: "Система" },
              ] as const
            ).map((t) => (
              <Button
                key={t.value}
                variant={theme === t.value ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setTheme(t.value)}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card glass>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Категории ({categories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50"
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <span className="truncate">{c.name}</span>
                {c.is_default && (
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    default
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card glass>
        <CardContent className="p-4 space-y-3">
          <Button variant="outline" className="w-full justify-start" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Экспорт в CSV
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Выйти
          </Button>
          <Button
            variant="destructive"
            className="w-full justify-start"
            onClick={deleteAccount}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Удалить аккаунт
          </Button>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center pb-8">
        Установите как PWA: «Поделиться» → «На экран Домой» (iOS Safari)
      </p>
    </div>
  );
}
