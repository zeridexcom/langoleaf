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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Expanded if hovered (desktop only)
  const isExpanded = sidebarHovered;

  // Initialize realtime notifications
  useRealtimeNotifications();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onMenuClick={() => setMobileMenuOpen(true)} />
      <div className="flex flex-1 relative">
        <Sidebar 
          isHovered={sidebarHovered}
          setIsHovered={setSidebarHovered}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
        <main className={cn(
          "flex-1 pt-24 pb-12 transition-all duration-300 min-w-0 max-lg:pl-0 px-4 sm:px-6 lg:px-8",
          isExpanded ? "lg:pl-72" : "lg:pl-[104px]"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}
