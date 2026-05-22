"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { authSchema, type AuthFormData } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User } from "lucide-react";

interface AuthFormProps {
  mode: "login" | "register";
  onToggle: () => void;
}

export function AuthForm({ mode, onToggle }: AuthFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  });

  const onSubmit = async (data: AuthFormData) => {
    setLoading(true);
    setError(null);

    if (mode === "register") {
      const { error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.full_name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      setError(null);
      alert("Проверьте email для подтверждения регистрации");
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
      window.location.href = "/dashboard";
    }
    setLoading(false);
  };

  const signInWithOAuth = async (provider: "google" | "apple") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md glass-card rounded-2xl p-6 md:p-8"
    >
      <h2 className="text-2xl font-bold mb-1">
        {mode === "login" ? "Вход" : "Регистрация"}
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        {mode === "login"
          ? "Войдите в свой аккаунт"
          : "Создайте бесплатный аккаунт"}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {mode === "register" && (
          <div>
            <Label htmlFor="full_name">Имя</Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="full_name"
                className="pl-10"
                placeholder="Ваше имя"
                {...register("full_name")}
              />
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="email">Email</Label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              className="pl-10"
              placeholder="email@example.com"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password">Пароль</Label>
          <div className="relative mt-1">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              className="pl-10"
              placeholder="••••••"
              {...register("password")}
            />
          </div>
          {errors.password && (
            <p className="text-xs text-destructive mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading
            ? "Загрузка..."
            : mode === "login"
              ? "Войти"
              : "Зарегистрироваться"}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">или</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          type="button"
          onClick={() => signInWithOAuth("google")}
        >
          Google
        </Button>
        <Button
          variant="outline"
          type="button"
          onClick={() => signInWithOAuth("apple")}
        >
          Apple
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        {mode === "login" ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
        <button
          type="button"
          onClick={onToggle}
          className="text-primary font-medium hover:underline"
        >
          {mode === "login" ? "Регистрация" : "Войти"}
        </button>
      </p>
    </motion.div>
  );
}
