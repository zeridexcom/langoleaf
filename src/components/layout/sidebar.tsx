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
  Rocket,
  School,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useState } from "react";

const menuItems = [
  { icon: LayoutDashboard, label: "Growth Center", href: "/" },
  { icon: Rocket, label: "Campaigns", href: "/campaigns" },
  { icon: School, label: "Language Hub", href: "/language-hub" },
  { icon: TrendingUp, label: "Earning Plans", href: "/earnings" },
  { icon: Users, label: "Students", href: "/students" },
  { icon: FileText, label: "Applications", href: "/applications" },
  { icon: FolderOpen, label: "Documents", href: "/documents" },
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
  const [activeItem, setActiveItem] = useState("Growth Center");

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-dark-surface border-r border-dark-border transition-all duration-300 z-40",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white shadow-lg hover:bg-primary/80 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* User Profile Card */}
        {!collapsed && (
          <div className="p-4">
            <div className="flex gap-3 items-center p-3 rounded-2xl bg-dark-elevated/50">
              <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-xl size-12 border border-primary/20" 
                   style={{backgroundImage: 'url("https://ui-avatars.com/api/?name=Sarah+Jenkins&background=ec5b13&color=fff")'}}>
              </div>
              <div className="flex flex-col truncate">
                <h1 className="text-white text-sm font-bold leading-tight">Sarah Jenkins</h1>
                <p className="text-slate-400 text-xs font-medium">Growth Agent Level 4</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  onClick={() => setActiveItem(item.label)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                    activeItem === item.label
                      ? "bg-primary text-white font-bold shadow-lg shadow-primary/20"
                      : "text-slate-400 hover:bg-dark-elevated hover:text-white"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 flex-shrink-0",
                      activeItem === item.label ? "text-white" : "text-slate-400"
                    )}
                  />
                  {!collapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span className="ml-auto bg-primary text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Progress Goal */}
        {!collapsed && (
          <div className="p-4 border-t border-dark-border">
            <div className="bg-primary/10 rounded-2xl p-4 mb-4">
              <p className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">Target 2026</p>
              <div className="h-2 w-full bg-dark-elevated rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{width: "75%"}}></div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">₹12.5L / ₹15L Commission Goal</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="p-3 border-t border-dark-border">
          <button
            className={cn(
              "flex items-center gap-3 px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-dark-elevated transition-all duration-200 w-full",
              collapsed && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}

