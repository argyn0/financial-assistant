import { Skeleton } from "@/components/ui/skeleton";

export default function AddLoading() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}
