# Финансовый помощник

Production-ready веб-приложение для учёта финансов с AI-аналитикой, импортом банковских выписок и PWA-поддержкой.

## Стек

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** + Radix UI + Framer Motion
- **Supabase** (Auth, PostgreSQL, RLS)
- **OpenAI** (`gpt-4o-mini`)
- **Zustand**, React Hook Form + Zod
- **Recharts**, next-pwa

## Быстрый старт

### 1. Установка

```bash
npm install
cp .env.example .env.local
```

### 2. Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. В SQL Editor выполните `supabase/migrations/001_initial.sql`
3. В Authentication → Providers включите Email, Google, Apple
4. Добавьте Redirect URL: `http://localhost:3000/auth/callback`
5. Скопируйте URL и ключи в `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Запуск

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

### 4. Сборка (проверено)

```bash
npm run build
npm start
```

> Без `.env.local` сборка проходит, но для работы нужны реальные ключи Supabase.

### Тестовая выписка

Пример CSV для импорта: `public/samples/statement-example.csv`

## Страницы

| Путь | Описание |
|------|----------|
| `/` | Лендинг + авторизация |
| `/dashboard` | Панель: баланс, графики, AI-совет |
| `/transactions` | Список операций, фильтры, массовое удаление |
| `/add` | Ручной ввод + импорт CSV/OFX |
| `/ai-insights` | Рекомендации + AI-чат |
| `/settings` | Профиль, тема, экспорт |

## Функции

- Email/пароль + Google/Apple OAuth
- RLS — данные изолированы по `user_id`
- CRUD транзакций с категориями и подписками
- Импорт CSV/OFX → AI-категоризация
- FAB + `Ctrl/Cmd + N` для быстрого ввода
- PWA для установки на iOS/Android
- Тёмная/светлая тема

## API (server-only)

- `POST /api/ai/categorize` — категоризация транзакций
- `POST /api/ai/analyze` — анализ паттернов
- `POST /api/ai/chat` — чат с финансовым контекстом

## Деплой на Vercel

```bash
npm i -g vercel
vercel
```

Добавьте переменные окружения в Vercel Dashboard.  
Обновите Redirect URL в Supabase: `https://your-app.vercel.app/auth/callback`

## PWA иконки

Иконки генерируются автоматически через `app/icon.tsx` и `app/apple-icon.tsx`.
Для установки на iOS: Safari → «Поделиться» → «На экран Домой».

## Структура

```
app/           # Страницы (App Router)
components/    # UI, layout, charts
lib/           # Supabase, OpenAI, data
hooks/         # theme, hotkey
stores/        # Zustand
utils/         # Парсинг выписок
types/         # TypeScript типы
supabase/      # SQL миграции
```

## Лицензия

MIT
