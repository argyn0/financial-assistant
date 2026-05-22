"use client";

import { isSupabaseConfigured } from "@/lib/supabase/client";

export function EnvBanner() {
  const missing = !isSupabaseConfigured();

  if (!missing) return null;

  return (
    <div className="bg-amber-500/90 text-amber-950 text-center text-sm py-2 px-4">
      Настройте Supabase: скопируйте <code className="font-mono">.env.example</code> →{" "}
      <code className="font-mono">.env.local</code> и укажите ключи проекта
    </div>
  );
}
