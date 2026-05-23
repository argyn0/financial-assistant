import type { ParsedTransaction } from "../types";
import {
  normalizeAmount,
  detectTypeFromAmount,
  parseDateString,
} from "../utils";

const LINE_PATTERN =
  /(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})\s+(.+?)\s+([-+]?\s*[\d\s,.]+)\s*₽?/i;

export function parseGenericText(text: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    const match = line.match(LINE_PATTERN);
    if (!match) continue;

    const date = parseDateString(match[1]);
    const description = match[2].trim();
    const amountRaw = match[3];
    const signed = amountRaw.includes("-");
    const amount = normalizeAmount(amountRaw);
    if (amount === 0) continue;

    transactions.push({
      date,
      amount,
      type: signed ? "expense" : detectTypeFromAmount(amount, amountRaw),
      description: description || "Операция",
      currency: "RUB",
      raw: line.slice(0, 200),
    });
  }

  return transactions;
}
