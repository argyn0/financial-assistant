-- 📌 ВЫПОЛНИТЬ ВРУЧНУЮ В SUPABASE SQL EDITOR

-- 1. Обновление таблицы categories
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS budget_limit DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS budget_period TEXT CHECK (budget_period IN ('daily', 'weekly', 'monthly', 'yearly'));

-- icon, color, is_default уже есть в 001_initial.sql

-- 2. Индексы
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories(type);

-- 3. Источник транзакции (импорт / ручной ввод)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'
  CHECK (source IN ('manual', 'import'));

-- 4. RLS (политики из 001 могут уже существовать — пересоздаём единую)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can manage own categories" ON public.categories;

CREATE POLICY "Users can manage own categories" ON public.categories
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
