import { z } from "zod";

export const parsedTransactionSchema = z.object({
  date: z.string().min(1),
  amount: z.number().positive(),
  type: z.enum(["income", "expense"]),
  description: z.string().min(1).max(500),
  currency: z.string().default("RUB"),
  category_id: z.string().uuid().optional().nullable(),
  raw: z.string().optional(),
});

export const importPreviewSchema = z.array(parsedTransactionSchema).min(1).max(500);

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ALLOWED_MIME_TYPES = [
  "text/csv",
  "application/vnd.ms-excel",
  "text/plain",
  "application/pdf",
  "application/x-ofx",
  "application/ofx",
] as const;
