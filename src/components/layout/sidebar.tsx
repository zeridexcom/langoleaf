"use client";

import {
  LayoutDashboard,
  Users,
  FileText,
  FolderOpen,
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
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Rocket, label: "Campaigns", href: "/campaigns" },
  { icon: School, label: "Language Hub", href: "/language-hub" },
  { icon: Users, label: "Students", href: "/students" },
  { icon: FileText, label: "Applications", href: "/applications" },
  { icon: TrendingUp, label: "Earnings", href: "/earnings" },
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
  const pathname = usePathname();
  const supabase = createClient();
  
  // Determine active item based on current pathname
  const getActiveItem = () => {
    const currentPath = pathname || "/dashboard";
    const activeMenuItem = menuItems.find(item => 
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
        "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r-2 border-black transition-all duration-150 ease-out z-40",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Collapse Button - Swiss Style */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 w-6 h-6 bg-black flex items-center justify-center text-white border-2 border-black hover:bg-[#FF3000] hover:border-[#FF3000] transition-all duration-150 ease-out"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* User Profile Card - Swiss Style */}
        {!collapsed && (
          <div className="p-4 border-b-2 border-black">
            <div className="flex gap-3 items-center p-3 bg-[#F2F2F2] border-2 border-black">
              <div className="bg-center bg-no-repeat aspect-square bg-cover size-12 border-2 border-black" 
                   style={{backgroundImage: 'url("https://ui-avatars.com/api/?name=Agent&background=000000&color=fff")'}}>
              </div>
              <div className="flex flex-col truncate">
                <h1 className="text-black text-sm font-black uppercase tracking-tight">Agent</h1>
                <p className="text-[#FF3000] text-xs font-black uppercase tracking-widest">Partner</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation - Swiss Style */}
        <nav className="flex-1 py-4 px-3 swiss-dots">
          <ul className="space-y-0">
            {menuItems.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 border-b-2 border-black transition-all duration-150 ease-out group font-black uppercase text-xs tracking-wide",
                    activeItem === item.label
                      ? "bg-black text-white border-black"
                      : "text-black hover:bg-[#FF3000] hover:text-white hover:border-[#FF3000]"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 flex-shrink-0",
                      activeItem === item.label ? "text-white" : "text-black group-hover:text-white"
                    )}
                  />
                  {!collapsed && (
                    <span className="text-xs">{item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span className="ml-auto bg-[#FF3000] text-white text-xs font-black px-2 py-0.5">
                      {item.badge}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Progress Goal - Swiss Style */}
        {!collapsed && (
          <div className="p-4 border-t-2 border-black bg-[#F2F2F2]">
            <div className="border-2 border-black p-4 bg-white">
              <p className="text-xs font-black text-black mb-2 uppercase tracking-widest">Target 2026</p>
              <div className="h-2 w-full bg-white border border-black">
                <div className="h-full bg-[#FF3000]" style={{width: "75%"}}></div>
              </div>
              <p className="text-[10px] text-black mt-2 font-black uppercase">₹12.5L / ₹15L Goal</p>
            </div>
          </div>
        )}

        {/* Logout - Swiss Style */}
        <div className="p-3 border-t-2 border-black">
          <button
            onClick={handleSignOut}
            className={cn(
              "flex items-center gap-3 px-4 py-3 border-2 border-black text-black hover:bg-black hover:text-white transition-all duration-150 ease-out w-full font-black uppercase text-xs tracking-wide",
              collapsed && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="text-xs">Sign Out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}

