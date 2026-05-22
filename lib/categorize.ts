import type { Category, TransactionType } from "@/types";

const RULES: { keywords: string[]; categoryName: string }[] = [
  { keywords: ["яндекс", "uber", "такси", "метро", "автобус", "бензин", "азс"], categoryName: "Транспорт" },
  { keywords: ["пятёрочка", "магнит", "перекрёсток", "ашан", "лента", "продукт"], categoryName: "Продукты" },
  { keywords: ["netflix", "spotify", "подписк", "subscription", "яндекс плюс"], categoryName: "Подписки" },
  { keywords: ["аптека", "клиника", "врач", "мед"], categoryName: "Здоровье" },
  { keywords: ["аренда", "жкх", "коммунал", "ипотек"], categoryName: "Жильё" },
  { keywords: ["кино", "steam", "игр", "развлеч"], categoryName: "Развлечения" },
  { keywords: ["зарплат", "аванс", "перевод от"], categoryName: "Зарплата" },
];

export function categorizeByRules(
  description: string,
  type: TransactionType,
  categories: Category[]
): Category | null {
  const lower = description.toLowerCase();
  const filtered = categories.filter((c) => c.type === type);

  for (const rule of RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) {
      const match = filtered.find(
        (c) => c.name.toLowerCase() === rule.categoryName.toLowerCase()
      );
      if (match) return match;
    }
  }

  return filtered.find((c) => c.name === "Прочее" || c.name === "Прочий доход") ?? null;
}
