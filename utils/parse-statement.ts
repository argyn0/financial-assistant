/**
 * @deprecated Используйте lib/parsers
 */
import { parseFileBuffer } from "@/lib/parsers";
import type { ParsedTransaction } from "@/lib/parsers/types";

export type { ParsedTransaction };

export async function parseStatementFile(
  content: string,
  filename: string
): Promise<ParsedTransaction[]> {
  const buffer = Buffer.from(content, "utf-8");
  const ext = filename.split(".").pop()?.toLowerCase() ?? "csv";
  const mime =
    ext === "pdf"
      ? "application/pdf"
      : ext === "ofx"
        ? "application/ofx"
        : "text/csv";

  const result = await parseFileBuffer(buffer, filename, mime);
  if (result.error && result.transactions.length === 0) {
    throw new Error(result.error);
  }
  return result.transactions;
}
