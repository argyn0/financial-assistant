export type TransactionType = "income" | "expense";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  default_currency: string;
  created_at: string;
  updated_at: string;
}

export type BudgetPeriod = "daily" | "weekly" | "monthly" | "yearly";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  is_default: boolean;
  budget_limit?: number | null;
  budget_period?: BudgetPeriod | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  category_id: string | null;
  category?: Category;
  description: string | null;
  date: string;
  currency: string;
  tags: string[];
  is_recurring: boolean;
  source?: "manual" | "import";
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  period: "weekly" | "monthly" | "yearly";
  currency: string;
  created_at: string;
}

export interface AIRecommendation {
  id: string;
  user_id: string;
  type: "daily" | "weekly" | "insight" | "anomaly";
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface ParsedTransaction {
  amount: number;
  type: TransactionType;
  description: string;
  date: string;
  raw?: Record<string, string>;
}

export interface DashboardStats {
  balance: number;
  income: number;
  expense: number;
  savingsRate: number;
}

export interface ChartDataPoint {
  name: string;
  income: number;
  expense: number;
}
