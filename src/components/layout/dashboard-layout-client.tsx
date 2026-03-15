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
  const [sidebarHovered, setSidebarHovered] = useState(false);

  // Expanded if hovered
  const isExpanded = sidebarHovered;

  // Initialize realtime notifications
  useRealtimeNotifications();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex flex-1 relative">
        <Sidebar 
          isHovered={sidebarHovered}
          setIsHovered={setSidebarHovered}
        />
        <main className={cn(
          "flex-1 pt-24 pb-12 transition-all duration-300 min-w-0",
          isExpanded ? "lg:pl-64" : "lg:pl-[72px]"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}
