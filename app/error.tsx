"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h2 className="text-2xl font-bold mb-2">Что-то пошло не так</h2>
      <p className="text-muted-foreground text-sm mb-6 max-w-md">
        {error.message || "Произошла непредвиденная ошибка"}
      </p>
      <Button onClick={reset}>Попробовать снова</Button>
    </div>
  );
}
