import { z } from "zod";

export const transactionSchema = z.object({
  amount: z.coerce.number().positive("Сумма должна быть больше 0"),
  type: z.enum(["income", "expense"]),
  category_id: z.string().uuid().optional().nullable(),
  description: z.string().max(500).optional(),
  date: z.string().min(1, "Укажите дату"),
  currency: z.string().default("RUB"),
  tags: z.array(z.string()).default([]),
  is_recurring: z.boolean().default(false),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;

export const quickAddSchema = z.object({
  amount: z.coerce.number().positive("Сумма должна быть больше 0"),
  category_id: z.string().uuid("Выберите категорию"),
  type: z.enum(["income", "expense"]).default("expense"),
});

export type QuickAddFormData = z.infer<typeof quickAddSchema>;

export const authSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
  full_name: z.string().optional(),
});

export type AuthFormData = z.infer<typeof authSchema>;

export const profileSchema = z.object({
  full_name: z.string().max(100).optional(),
  default_currency: z.string().default("RUB"),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Укажите название").max(50),
  icon: z.string().default("tag"),
  color: z.string().default("#6366f1"),
  type: z.enum(["income", "expense"]),
});

export const chatSchema = z.object({
  message: z.string().min(1, "Введите сообщение").max(1000),
});
