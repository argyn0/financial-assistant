import type { ParsedTransaction } from "../types";
import {
  normalizeAmount,
  detectTypeFromAmount,
  parseDateString,
} from "../utils";

/** Строки: DD.MM.YYYY | ОПИСАНИЕ | -1234.56 ₽ */
export function parseTinkoffText(text: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);

  const patterns = [
    /^(\d{2}\.\d{2}\.\d{4})\s+(.+?)\s+([-+]?\s*[\d\s,.]+)\s*₽?\s*$/i,
    /^(\d{2}\.\d{2}\.\d{4})\s*\|\s*(.+?)\s*\|\s*([-+]?\s*[\d\s,.]+)/i,
  ];

  for (const line of lines) {
    for (const pattern of patterns) {
      const m = line.match(pattern);
      if (!m) continue;

      const amountRaw = m[3];
      const amount = normalizeAmount(amountRaw);
      if (amount === 0) continue;

      transactions.push({
        date: parseDateString(m[1]),
        description: m[2].trim(),
        amount,
        type: detectTypeFromAmount(amount, amountRaw),
        currency: "RUB",
        raw: line.slice(0, 200),
      });
      break;
    }
  }

  return transactions;
}
