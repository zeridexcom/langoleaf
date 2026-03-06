"use client";

import {
  LayoutDashboard,
  Users,
  FileText,
  FolderOpen,
  Wallet,
  UserCircle,
  Bell,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useState } from "react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Users, label: "Students", href: "/students" },
  { icon: FileText, label: "Applications", href: "/applications" },
  { icon: FolderOpen, label: "Documents", href: "/documents" },
  { icon: Wallet, label: "Earnings", href: "/earnings" },
  { icon: UserCircle, label: "Profile", href: "/profile" },
  { icon: Bell, label: "Notifications", href: "/notifications", badge: 3 },
  { icon: HelpCircle, label: "Support", href: "/support" },
  { icon: Shield, label: "Admin", href: "/admin" },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const [activeItem, setActiveItem] = useState("Dashboard");

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-[#1a1a2e] border-r border-[#2d2d4a] transition-all duration-300 z-40",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 w-6 h-6 bg-[#6d28d9] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#6d28d9]/80 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  onClick={() => setActiveItem(item.label)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                    activeItem === item.label
                      ? "bg-[#6d28d9]/20 text-[#6d28d9]"
                      : "text-gray-400 hover:bg-[#252542] hover:text-white"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 flex-shrink-0",
                      activeItem === item.label ? "text-[#6d28d9]" : "text-gray-400"
                    )}
                  />
                  {!collapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span className="ml-auto bg-amber-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-[#2d2d4a]">
          <button
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-[#252542] hover:text-white transition-all duration-200 w-full",
              collapsed && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}

