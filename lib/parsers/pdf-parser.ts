import type { ParseResult } from "./types";
import { parseTinkoffText } from "./banks/tinkoff";
import { parseSberText } from "./banks/sber";
import { parseGenericText } from "./banks/generic";

type BankId = "tinkoff" | "sber" | "generic";

function detectBank(text: string): BankId {
  const lower = text.toLowerCase();
  if (lower.includes("тинькофф") || lower.includes("tinkoff") || lower.includes("т-банк"))
    return "tinkoff";
  if (
    lower.includes("сбербанк") ||
    lower.includes("sberbank") ||
    lower.includes("сбер ")
  )
    return "sber";
  return "generic";
}

export async function parsePDFBuffer(buffer: Buffer): Promise<ParseResult> {
  try {
    const mod = await import("pdf-parse");
    const pdfParse =
      typeof mod.default === "function"
        ? mod.default
        : (mod as unknown as (buf: Buffer) => Promise<{ text: string }>);
    const data = await pdfParse(buffer);
    const text = data.text ?? "";

    if (!text.trim()) {
      return { transactions: [], error: "PDF не содержит извлекаемого текста" };
    }

    const bank = detectBank(text);
    let transactions =
      bank === "tinkoff"
        ? parseTinkoffText(text)
        : bank === "sber"
          ? parseSberText(text)
          : parseGenericText(text);

    if (transactions.length === 0) {
      transactions = parseGenericText(text);
      return {
        transactions,
        bank: "generic",
        error:
          transactions.length === 0
            ? "Не удалось распознать операции в PDF. Попробуйте CSV."
            : undefined,
      };
    }

    return { transactions, bank };
  } catch {
    return {
      transactions: [],
      error: "Ошибка чтения PDF. Убедитесь, что файл не защищён паролем.",
    };
  }
}
