"use client";

import { Sidebar } from "./sidebar";
import { FAB } from "./fab";
import { QuickAddModal } from "./quick-add-modal";
import { Toast } from "./toast";
import { PageTransition } from "@/components/providers/page-transition";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:pl-64 pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
      <FAB />
      <QuickAddModal />
      <Toast />
    </div>
  );
}
