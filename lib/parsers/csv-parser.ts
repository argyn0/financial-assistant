import { parse } from "csv-parse/sync";
import Papa from "papaparse";
import type { ParsedTransaction } from "./types";
import {
  normalizeAmount,
  detectTypeFromAmount,
  parseDateString,
} from "./utils";

const COLUMN_ALIASES: Record<string, string[]> = {
  date: ["date", "дата", "transaction date", "дата операции", "дата проведения"],
  amount: ["amount", "сумма", "sum", "сумма операции", "transaction amount"],
  description: [
    "description",
    "описание",
    "назначение",
    "details",
    "memo",
    "назначение платежа",
    "операция",
  ],
};

function findColumn(headers: string[], key: string): number {
  const aliases = COLUMN_ALIASES[key] || [key];
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const alias of aliases) {
    const idx = lower.findIndex((h) => h.includes(alias.toLowerCase()));
    if (idx >= 0) return idx;
  }
  return -1;
}

export function parseCSVContent(content: string): ParsedTransaction[] {
  const trimmed = content.trim();
  let rows: string[][] = [];

  try {
    rows = parse(trimmed, {
      columns: false,
      skip_empty_lines: true,
      relax_column_count: true,
      delimiter: trimmed.includes(";") ? ";" : ",",
    }) as string[][];
  } catch {
    const result = Papa.parse<string[]>(trimmed, {
      header: false,
      skipEmptyLines: true,
      delimiter: trimmed.includes(";") ? ";" : ",",
    });
    rows = result.data;
  }

  if (rows.length < 2) {
    throw new Error("Файл пуст или содержит недостаточно данных");
  }

  const headers = rows[0];
  const dateIdx = findColumn(headers, "date");
  const amountIdx = findColumn(headers, "amount");
  const descIdx = findColumn(headers, "description");

  if (amountIdx < 0) {
    throw new Error("Не найдена колонка с суммой. Проверьте формат CSV.");
  }

  const transactions: ParsedTransaction[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;

    const amountRaw = row[amountIdx] ?? "0";
    const amount = normalizeAmount(amountRaw);
    if (amount === 0) continue;

    transactions.push({
      amount,
      type: detectTypeFromAmount(amount, amountRaw),
      description:
        descIdx >= 0 ? (row[descIdx] ?? "").trim() : `Операция ${i}`,
      date:
        dateIdx >= 0
          ? parseDateString(row[dateIdx] ?? "")
          : new Date().toISOString().split("T")[0],
      currency: "RUB",
      raw: row.join(";").slice(0, 200),
    });
  }

  if (transactions.length === 0) {
    throw new Error("Не удалось извлечь транзакции из CSV");
  }

  return transactions;
}
