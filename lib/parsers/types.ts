import type { TransactionType } from "@/types";

export interface ParsedTransaction {
  date: string;
  amount: number;
  type: TransactionType;
  description: string;
  currency: string;
  raw?: string;
  category_id?: string | null;
}

export interface ParseResult {
  transactions: ParsedTransaction[];
  error?: string;
  bank?: "tinkoff" | "sber" | "generic";
}
