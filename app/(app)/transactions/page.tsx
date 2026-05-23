import { createClient } from "@/lib/supabase/server";
import { getTransactions } from "@/lib/data";
import { getOrCreateDefaults } from "@/lib/actions/categories";
import { TransactionsClient } from "./transactions-client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/?auth=login");

  const [transactions, catResult] = await Promise.all([
    getTransactions(),
    getOrCreateDefaults(user.id),
  ]);

  const categories = catResult.success ? catResult.data : [];

  return (
    <TransactionsClient
      initialTransactions={transactions}
      categories={categories}
      userId={user.id}
    />
  );
}
