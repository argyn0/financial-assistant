import { parse } from "csv-parse/sync";
import Papa from "papaparse";
import type { ParsedTransaction, TransactionType } from "@/types";

function normalizeAmount(raw: string): number {
  const cleaned = raw.replace(/\s/g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  return Math.abs(parseFloat(cleaned) || 0);
}

function detectType(amount: number, raw?: string): TransactionType {
  if (raw) {
    const lower = raw.toLowerCase();
    if (lower.includes("приход") || lower.includes("credit") || lower.includes("+"))
      return "income";
    if (lower.includes("расход") || lower.includes("debit") || lower.includes("-"))
      return "expense";
  }
  return amount < 0 ? "income" : "expense";
}

function parseDate(raw: string): string {
  const formats = [
    /^(\d{2})\.(\d{2})\.(\d{4})$/,
    /^(\d{4})-(\d{2})-(\d{2})$/,
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
  ];
  for (const fmt of formats) {
    const m = raw.trim().match(fmt);
    if (m) {
      if (m[1].length === 4) return `${m[1]}-${m[2]}-${m[3]}`;
      return `${m[3]}-${m[2]}-${m[1]}`;
    }
  }
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  return new Date().toISOString().split("T")[0];
}

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

export function parseCSV(content: string): ParsedTransaction[] {
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
      type: detectType(amount, amountRaw),
      description: descIdx >= 0 ? (row[descIdx] ?? "").trim() : `Операция ${i}`,
      date: dateIdx >= 0 ? parseDate(row[dateIdx] ?? "") : new Date().toISOString().split("T")[0],
      raw: Object.fromEntries(headers.map((h, j) => [h, row[j] ?? ""])),
    });
  }

  if (transactions.length === 0) {
    throw new Error("Не удалось извлечь транзакции из файла");
  }

  return transactions;
}

export function parseOFX(content: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const stmtRegex =
    /<STMTTRN>[\s\S]*?<\/STMTTRN>/gi;
  const matches = content.match(stmtRegex) ?? [];

  for (const block of matches) {
    const amountMatch = block.match(/<TRNAMT>([^<]+)/i);
    const dateMatch = block.match(/<DTPOSTED>(\d{8})/i);
    const memoMatch = block.match(/<MEMO>([^<]+)/i);
    const nameMatch = block.match(/<NAME>([^<]+)/i);

    if (!amountMatch) continue;

    const rawAmount = parseFloat(amountMatch[1]);
    const amount = Math.abs(rawAmount);
    if (amount === 0) continue;

    let date = new Date().toISOString().split("T")[0];
    if (dateMatch) {
      const d = dateMatch[1];
      date = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
    }

    transactions.push({
      amount,
      type: rawAmount > 0 ? "income" : "expense",
      description: (memoMatch?.[1] ?? nameMatch?.[1] ?? "OFX транзакция").trim(),
      date,
    });
  }

  if (transactions.length === 0) {
    throw new Error("Не найдены транзакции в OFX файле");
  }

  return transactions;
}

export function parseStatementFile(
  content: string,
  filename: string
): ParsedTransaction[] {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "ofx" || ext === "qfx") return parseOFX(content);
  if (ext === "csv" || ext === "txt") return parseCSV(content);
  throw new Error("Поддерживаются только CSV и OFX файлы");
}
