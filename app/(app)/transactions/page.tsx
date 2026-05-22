import { getTransactions } from "@/lib/data";
import { TransactionsClient } from "./transactions-client";

export default async function TransactionsPage() {
  const transactions = await getTransactions();
  return <TransactionsClient initialTransactions={transactions} />;
}
