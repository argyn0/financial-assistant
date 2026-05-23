import { createClient } from "@/lib/supabase/server";
import { getOrCreateDefaults } from "@/lib/actions/categories";
import { CategoriesPageClient } from "./categories-client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/?auth=login");

  const result = await getOrCreateDefaults(user.id);
  const categories = result.success ? result.data : [];

  return <CategoriesPageClient initialCategories={categories} userId={user.id} />;
}
