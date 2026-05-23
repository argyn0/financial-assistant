import type { TransactionType } from "@/types";

export function normalizeAmount(raw: string): number {
  const cleaned = raw
    .replace(/\s/g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  return Math.abs(parseFloat(cleaned) || 0);
}

export function detectTypeFromAmount(
  amount: number,
  raw?: string
): TransactionType {
  if (raw) {
    const lower = raw.toLowerCase();
    if (
      lower.includes("+") ||
      lower.includes("приход") ||
      lower.includes("credit")
    )
      return "income";
    if (
      lower.includes("-") ||
      lower.includes("расход") ||
      lower.includes("debit")
    )
      return "expense";
  }
  return amount < 0 ? "income" : "expense";
}

export function parseDateString(raw: string): string {
  const trimmed = raw.trim();
  const dmy = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;

  const ymd = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) return trimmed;

  const dmySlash = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmySlash) return `${dmySlash[3]}-${dmySlash[2]}-${dmySlash[1]}`;

  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];

  return new Date().toISOString().split("T")[0];
}
