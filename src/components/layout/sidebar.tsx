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
  isHovered: boolean;
  setIsHovered: (hovered: boolean) => void;
}

export function Sidebar({ 
  isHovered, 
  setIsHovered 
}: SidebarProps) {
  const pathname = usePathname();
  const supabase = createClient();
  const [userRole, setUserRole] = useState<string | null>(null);

  // Effectively expanded if hovered
  const isExpanded = isHovered;
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "fixed left-4 top-20 h-[calc(100vh-6rem)] bg-white/80 backdrop-blur-xl border border-white/20 transition-all duration-300 z-40 shadow-2xl rounded-3xl overflow-hidden",
        "hidden lg:block",
        isExpanded ? "w-64" : "w-16"
      )}
    >
      <div className="flex flex-col h-full group/dock">
        {/* Collapse button removed */}

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
          <ul className="space-y-1 relative" style={{ perspective: "1000px" }}>
            {menuItems.map((item, index) => (
              <li key={item.label} className="group/item relative">
                <a
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-3 transition-all duration-300 font-bold rounded-2xl relative",
                    "origin-left transform transition-transform duration-200 ease-out",
                    "hover:scale-125 hover:mx-2 hover:shadow-2xl hover:z-50",
                    "group-hover/dock:[&:not(:hover)]:scale-95 group-hover/dock:[&:not(:hover)]:opacity-60",
                    activeItem === item.label
                      ? "bg-primary text-white shadow-lg shadow-primary/30 z-10"
                      : "text-gray-500 hover:bg-white hover:text-gray-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 flex-shrink-0 transition-all duration-300",
                      activeItem === item.label ? "text-white" : "text-gray-400 group-hover/item:text-primary"
                    )}
                  />
                  <span className={cn(
                    "ml-3 font-medium truncate transition-all duration-300",
                    isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 pointer-events-none text-[0px]"
                  )}>
                    {item.label}
                  </span>
                  {item.badge && isExpanded && (
                    <span className="ml-auto bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center animate-in fade-in duration-300 shadow-sm border border-white/20">
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
          "p-4 transition-all duration-300 border-t border-gray-100/50",
          !isExpanded && "px-3"
        )}>
          <div className={cn(
            "bg-primary/10 backdrop-blur-md border border-primary/20 p-4 rounded-3xl transition-all duration-300",
            !isExpanded && "p-2 border-transparent bg-transparent shadow-none"
          )}>
            <p className={cn(
              "text-[10px] font-black text-primary mb-2 uppercase tracking-widest transition-all duration-300",
              isExpanded ? "opacity-100 h-auto" : "opacity-0 h-0 overflow-hidden"
            )}>Target 2026</p>
            <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden shadow-inner">
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
              "flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-300 w-full font-bold rounded-2xl group active:scale-95 hover:scale-[1.02]",
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

