import { getCategories } from "@/lib/data";
import { AddTransactionClient } from "./add-client";

export default async function AddPage() {
  const categories = await getCategories();
  return <AddTransactionClient categories={categories} />;
}
