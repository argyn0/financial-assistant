import { Suspense } from "react";
import Link from "next/link";
import {
  getDashboardStats,
  getChartData,
  getCategoryBreakdown,
  getDailyTip,
  getTransactions,
} from "@/lib/data";
import { ensureDailyTip } from "@/lib/actions/ai";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardClient } from "./dashboard-client";

async function DashboardContent() {
  await ensureDailyTip();

  const [stats, chartData, categories, tip, recent] = await Promise.all([
    getDashboardStats(),
    getChartData(),
    getCategoryBreakdown(),
    getDailyTip(),
    getTransactions(5),
  ]);

  return (
    <DashboardClient
      stats={stats}
      chartData={chartData}
      categories={categories}
      tip={tip}
      recent={recent}
    />
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Панель управления</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Обзор ваших финансов за месяц
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/transactions">
              <ArrowLeftRight className="h-4 w-4" />
              Операции
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/add">
              <PlusCircle className="h-4 w-4" />
              Добавить
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[300px] rounded-xl" />
    </div>
  );
}
