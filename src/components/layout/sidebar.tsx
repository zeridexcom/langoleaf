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
import { createClient } from "@/lib/supabase/client";

const menuItems = [
  { icon: LayoutDashboard, label: "Growth Center", href: "/dashboard" },
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
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-dark-surface border-r-2 border-dark-border transition-all duration-300 z-40",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 w-6 h-6 bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 hover:bg-primary/80 transition-colors border-2 border-white/20"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* User Profile Card */}
        {!collapsed && (
          <div className="p-4 border-b-2 border-dark-border">
            <div className="flex gap-3 items-center p-3 bg-dark-elevated border-2 border-dark-border">
              <div className="bg-center bg-no-repeat aspect-square bg-cover size-12 border-2 border-primary" 
                   style={{backgroundImage: 'url("https://ui-avatars.com/api/?name=Sarah+Jenkins&background=ec5b13&color=fff")'}}>
              </div>
              <div className="flex flex-col truncate">
                <h1 className="text-white text-sm font-black leading-tight">Sarah Jenkins</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Level 4 Agent</p>
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
                    "flex items-center gap-3 px-4 py-3 border-2 border-transparent transition-all duration-200 group font-bold",
                    activeItem === item.label
                      ? "bg-primary text-white border-primary shadow-[4px_4px_0px_0px_rgba(236,91,19,0.3)]"
                      : "text-slate-400 hover:bg-dark-elevated hover:text-white hover:border-dark-border"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 flex-shrink-0",
                      activeItem === item.label ? "text-white" : "text-slate-400"
                    )}
                  />
                  {!collapsed && (
                    <span className="text-sm">{item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span className="ml-auto bg-primary text-white text-xs font-black px-2 py-0.5">
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
          <div className="p-4 border-t-2 border-dark-border">
            <div className="bg-primary/10 border-2 border-primary/30 p-4">
              <p className="text-xs font-black text-primary mb-2 uppercase tracking-wider">Target 2026</p>
              <div className="h-3 w-full bg-dark-elevated border border-dark-border overflow-hidden">
                <div className="h-full bg-primary" style={{width: "75%"}}></div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-bold">₹12.5L / ₹15L Commission Goal</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="p-3 border-t-2 border-dark-border">
          <button
            onClick={handleSignOut}
            className={cn(
              "flex items-center gap-3 px-4 py-2 border-2 border-transparent text-slate-400 hover:text-white hover:bg-dark-elevated hover:border-dark-border transition-all duration-200 w-full font-bold",
              collapsed && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="text-sm">Sign Out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}

