import type { ParsedTransaction } from "../types";
import {
  normalizeAmount,
  detectTypeFromAmount,
  parseDateString,
} from "../utils";

/** Эвристика для выписок Сбербанка */
export function parseSberText(text: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    const dateMatch = line.match(/(\d{2}\.\d{2}\.\d{4})/);
    const amountMatch = line.match(/([-+]?\s*[\d\s]+[,.]\d{2})\s*(₽|RUB|руб)?/i);
    if (!dateMatch || !amountMatch) continue;

    const amountRaw = amountMatch[1];
    const amount = normalizeAmount(amountRaw);
    if (amount === 0) continue;

    let description = line
      .replace(dateMatch[0], "")
      .replace(amountMatch[0], "")
      .replace(/₽|RUB|руб/gi, "")
      .trim();

    if (description.length < 2) description = "Операция Сбер";

    transactions.push({
      date: parseDateString(dateMatch[1]),
      description: description.slice(0, 200),
      amount,
      type: detectTypeFromAmount(amount, amountRaw),
      currency: "RUB",
      raw: line.slice(0, 200),
    });
  }

  return transactions;
}
