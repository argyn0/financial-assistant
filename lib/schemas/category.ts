import { z } from "zod";

export const BUDGET_PERIODS = ["daily", "weekly", "monthly", "yearly"] as const;

export const CATEGORY_ICONS = [
  "tag",
  "shopping-cart",
  "car",
  "home",
  "heart-pulse",
  "gamepad-2",
  "briefcase",
  "coffee",
  "plane",
  "repeat",
  "laptop",
  "trending-up",
] as const;

export const CATEGORY_COLORS = [
  "#6366f1",
  "#22c55e",
  "#3b82f6",
  "#ef4444",
  "#f59e0b",
  "#ec4899",
] as const;

export const categoryFormSchema = z.object({
  name: z
    .string()
    .min(1, "Укажите название")
    .max(50, "Максимум 50 символов"),
  type: z.enum(["income", "expense"]),
  icon: z.string().min(1).default("tag"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Некорректный цвет"),
  budget_limit: z.coerce.number().positive().optional().nullable(),
  budget_period: z.enum(BUDGET_PERIODS).optional().nullable(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const categoryUpdateSchema = categoryFormSchema.partial().extend({
  id: z.string().uuid(),
});
