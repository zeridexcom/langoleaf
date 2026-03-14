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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex flex-1 relative">
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        <main className={cn(
          "flex-1 pt-24 pb-12 transition-all duration-300 min-w-0",
          sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}
