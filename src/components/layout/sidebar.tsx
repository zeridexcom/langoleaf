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
  const [isHovered, setIsHovered] = useState(false);

  // Effectively expanded if either manually uncollapsed OR hovered
  const isExpanded = !collapsed || isHovered;
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
      onMouseEnter={() => collapsed && setIsHovered(true)}
      onMouseLeave={() => collapsed && setIsHovered(false)}
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-all duration-300 z-40 shadow-sm overflow-hidden",
        "hidden lg:block",
        isExpanded ? "w-64" : "w-20"
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
        <div className="p-4 border-b border-gray-100">
          <div className={cn(
            "flex gap-3 items-center p-2.5 bg-gray-50 border border-gray-200 rounded-xl transition-all duration-300",
            !isExpanded && "p-1 bg-transparent border-transparent"
          )}>
            <div className={cn(
              "bg-center bg-no-repeat aspect-square bg-cover rounded-xl transition-all duration-300 shrink-0 shadow-sm",
              isExpanded ? "size-11" : "size-10"
            )} 
                 style={{backgroundImage: 'url("https://ui-avatars.com/api/?name=Agent&background=ec5b13&color=fff")'}}>
            </div>
            <div className={cn(
              "flex flex-col truncate transition-all duration-300",
              isExpanded ? "opacity-100 translate-x-0 w-auto" : "opacity-0 -translate-x-4 w-0 pointer-events-none"
            )}>
              <h1 className="text-gray-900 text-sm font-black leading-tight">Agent</h1>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Partner</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto hide-scrollbar">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-3 border transition-all duration-300 group font-bold rounded-xl",
                    activeItem === item.label
                      ? "bg-primary text-white border-primary shadow-premium"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 border-transparent"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 flex-shrink-0 transition-colors",
                      activeItem === item.label ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                    )}
                  />
                  <span className={cn(
                    "text-sm truncate transition-all duration-300",
                    isExpanded ? "opacity-100 translate-x-0' w-auto" : "opacity-0 -translate-x-4 w-0 pointer-events-none"
                  )}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className={cn(
                      "ml-auto bg-primary text-white text-[10px] font-black px-1.5 py-0.5 rounded-full transition-all duration-300",
                      isExpanded ? "opacity-100 scale-100" : "opacity-0 scale-50 pointer-events-none"
                    )}>
                      {item.badge}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Progress Goal */}
        <div className={cn(
          "p-4 transition-all duration-300 border-t border-gray-100",
          !isExpanded && "px-3"
        )}>
          <div className={cn(
            "bg-primary/5 border border-primary/10 p-4 rounded-2xl transition-all duration-300",
            !isExpanded && "p-2 border-transparent bg-transparent"
          )}>
            <p className={cn(
              "text-[10px] font-black text-primary mb-2 uppercase tracking-widest transition-all duration-300",
              isExpanded ? "opacity-100 h-auto" : "opacity-0 h-0 overflow-hidden"
            )}>Target 2026</p>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-primary rounded-full shadow-sm" style={{width: "75%"}}></div>
            </div>
            <p className={cn(
              "text-[10px] text-gray-400 mt-2 font-black uppercase tracking-wider transition-all duration-300",
              isExpanded ? "opacity-100 h-auto" : "opacity-0 h-0 overflow-hidden"
            )}>₹12.5L / ₹15L</p>
          </div>
        </div>

        {/* Logout */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleSignOut}
            className={cn(
              "flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-300 w-full font-bold rounded-xl group",
              !isExpanded && "justify-center px-0"
            )}
          >
            <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className={cn(
              "text-sm transition-all duration-300",
              isExpanded ? "opacity-100 translate-x-0 w-auto" : "opacity-0 -translate-x-4 w-0 pointer-events-none"
            )}>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

