import type { ParseResult, ParsedTransaction } from "./types";
import { parseCSVContent } from "./csv-parser";
import { parsePDFBuffer } from "./pdf-parser";
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from "@/lib/schemas/import";

export type { ParsedTransaction, ParseResult } from "./types";

function parseOFX(content: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const stmtRegex = /<STMTTRN>[\s\S]*?<\/STMTTRN>/gi;
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
      currency: "RUB",
    });
  }

  if (transactions.length === 0) {
    throw new Error("Не найдены транзакции в OFX файле");
  }

  return transactions;
}

export async function parseFileBuffer(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<ParseResult> {
  if (buffer.length > MAX_FILE_SIZE) {
    return { transactions: [], error: "Файл превышает лимит 10 МБ" };
  }

  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const mimeOk =
    ALLOWED_MIME_TYPES.includes(mimeType as (typeof ALLOWED_MIME_TYPES)[number]) ||
    ["csv", "pdf", "ofx", "qfx", "txt"].includes(ext);

  if (!mimeOk) {
    return {
      transactions: [],
      error: "Поддерживаются только CSV, PDF и OFX",
    };
  }

  try {
    if (ext === "pdf" || mimeType === "application/pdf") {
      return await parsePDFBuffer(buffer);
    }

    const content = buffer.toString("utf-8");

    if (ext === "ofx" || ext === "qfx") {
      return { transactions: parseOFX(content) };
    }

    if (ext === "csv" || ext === "txt" || mimeType.includes("csv") || mimeType.includes("text")) {
      return { transactions: parseCSVContent(content) };
    }

    return { transactions: [], error: "Неподдерживаемый формат файла" };
  } catch (e) {
    return {
      transactions: [],
      error: e instanceof Error ? e.message : "Ошибка парсинга файла",
    };
  }
}
