"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils/cn";
import { DashboardPageLayout } from "@/components/ui/design-system";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

export function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Initialize realtime notifications
  useRealtimeNotifications();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="flex justify-center">
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        <main className={cn(
          "flex-1 pt-24 pb-12 transition-all duration-300",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        )}>
          <DashboardPageLayout>
            {children}
          </DashboardPageLayout>
        </main>
      </div>
    </div>
  );
}
