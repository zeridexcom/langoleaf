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
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
  adminOnly?: boolean;
}

const allMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Rocket, label: "Campaigns", href: "/campaigns" },
  { icon: School, label: "Course Hub", href: "/course-hub" },
  { icon: Users, label: "Students", href: "/students" },
  { icon: FileText, label: "Applications", href: "/applications" },
  { icon: TrendingUp, label: "Earnings", href: "/earnings" },
  { icon: FolderOpen, label: "Documents", href: "/documents" },
  { icon: UserCircle, label: "Profile", href: "/profile" },
  { icon: Bell, label: "Notifications", href: "/notifications", badge: 3 },
  { icon: HelpCircle, label: "Support", href: "/support" },
  { icon: Shield, label: "Admin", href: "/admin", adminOnly: true },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const supabase = createClient();
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Fetch user role on mount
  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setUserRole(profile?.role || "freelancer");
      }
    };
    fetchUserRole();
  }, [supabase]);
  
  // Filter menu items based on role
  const menuItems = allMenuItems.filter(item => {
    if (item.adminOnly) {
      return userRole === "admin";
    }
    return true;
  });
  
  // Determine active item based on current pathname
  const getActiveItem = () => {
    const currentPath = pathname || "/dashboard";
    const activeMenuItem = menuItems.find((item: MenuItem) => 
      currentPath === item.href || currentPath.startsWith(item.href + "/")
    );
    return activeMenuItem?.label || "Dashboard";
  };
  
  const activeItem = getActiveItem();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-slate-200 transition-all duration-300 z-40 shadow-sm",
        "hidden lg:block",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 w-6 h-6 bg-primary flex items-center justify-center text-white rounded-full shadow-md hover:bg-primary/80 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* User Profile Card */}
        {!collapsed && (
          <div className="p-4 border-b border-slate-100">
            <div className="flex gap-3 items-center p-2 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="bg-center bg-no-repeat aspect-square bg-cover size-10 rounded-lg shadow-sm" 
                   style={{backgroundImage: 'url("https://ui-avatars.com/api/?name=Agent&background=4f46e5&color=fff")'}}>
              </div>
              <div className="flex flex-col truncate">
                <h1 className="text-slate-900 text-xs font-black leading-tight">Agent Portal</h1>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Partner</p>
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
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 transition-all duration-200 group font-black rounded-lg text-[10px] uppercase tracking-[0.15em]",
                    activeItem === item.label
                      ? "bg-slate-900 text-white shadow-premium"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-4 h-4 flex-shrink-0",
                      activeItem === item.label ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                  {!collapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span className="ml-auto bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
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
          <div className="p-4 border-t border-slate-100">
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
              <p className="text-[9px] font-black text-slate-500 mb-2 uppercase tracking-[0.2em]">Target 2026</p>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{width: "75%"}}></div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-[10px] text-slate-900 font-black">₹12.5L</p>
                <p className="text-[10px] text-slate-400 font-bold italic">82% to Goal</p>
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={handleSignOut}
            className={cn(
              "flex items-center gap-3 px-4 py-2 border border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 w-full font-bold rounded-lg",
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

