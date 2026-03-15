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
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AdminDashboardStats, FreelancerDashboardStats } from "@/types/api";

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
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
}

import { useDashboard } from "@/hooks/useDashboard";

export function Sidebar({ 
  isHovered, 
  setIsHovered,
  mobileMenuOpen,
  setMobileMenuOpen
}: SidebarProps) {
  const pathname = usePathname();
  const supabase = createClient();
  const [userRole, setUserRole] = useState<string | null>(null);
  const { data: dashboardData } = useDashboard();

  const totalEarnings = dashboardData && 'totalEarnings' in dashboardData 
    ? (dashboardData as FreelancerDashboardStats).totalEarnings 
    : dashboardData && 'totalRevenue' in dashboardData 
      ? (dashboardData as AdminDashboardStats).totalRevenue 
      : 0;
      
  const targetEarnings = 1500000; // 15L target
  const progressPercentage = Math.min((totalEarnings / targetEarnings) * 100, 100);

  // Function to format currency in Lakhs
  const formatLakhs = (amount: number) => {
    return (amount / 100000).toFixed(1) + "L";
  };

  // Effectively expanded if hovered on desktop, or if mobile menu is open
  const isExpanded = isHovered || mobileMenuOpen;
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
    <>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setMobileMenuOpen?.(false)}
        />
      )}
      
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "fixed top-0 lg:top-[52px] h-[100vh] lg:h-[calc(100vh-52px)] bg-white border-r border-gray-100 transition-all duration-300 z-50 overflow-hidden",
          mobileMenuOpen ? "left-0 shadow-2xl" : "-left-[100%] lg:left-0",
          isExpanded ? "w-64" : "w-64 lg:w-[72px]"
        )}
      >
        <div className="flex flex-col h-full group/dock">
          {/* Mobile Header logic with Close Button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 lg:hidden min-h-[52px]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-primary flex items-center justify-center rounded-lg shadow-sm">
                <Zap className="w-3.5 h-3.5 text-white" fill="currentColor" />
              </div>
              <div>
                <h1 className="text-[13px] font-black text-gray-900 tracking-tight leading-none">Lango</h1>
              </div>
            </div>
            <button 
              onClick={() => setMobileMenuOpen?.(false)}
              className="p-1 -mr-2 text-gray-500 hover:bg-gray-100 rounded-lg flex items-center justify-center min-w-[44px] min-h-[44px]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        {/* User Profile Card */}
        <div className="p-3 border-b border-gray-100 flex justify-center">
          <div className={cn(
            "flex gap-3 items-center p-1.5 bg-gray-50 border border-gray-100 rounded-xl transition-all duration-300 w-full",
            !isExpanded && "justify-center bg-transparent border-transparent px-0"
          )}>
            <div className={cn(
              "bg-center bg-no-repeat aspect-square bg-cover rounded-xl transition-all duration-300 shrink-0 shadow-sm flex items-center justify-center font-black text-white bg-primary",
              isExpanded ? "w-8 h-8 text-xs" : "w-8 h-8 text-xs"
            )}>
              AG
            </div>
            <div className={cn(
              "flex flex-col truncate transition-all duration-300 overflow-hidden",
              isExpanded ? "opacity-100 translate-x-0 w-auto" : "opacity-0 -translate-x-4 w-0 pointer-events-none"
            )}>
              <h1 className="text-gray-900 text-sm font-black leading-tight">Agent</h1>
              <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest">Partner</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <ul className="space-y-1 relative" style={{ perspective: "1000px" }}>
            {menuItems.map((item, index) => (
              <li key={item.label} className="group/item relative">
                <a
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-3 transition-all duration-300 font-bold rounded-2xl relative",
                    "origin-left transform transition-transform duration-200 ease-out",
                    "hover:scale-110 hover:mx-2 hover:shadow-xl hover:bg-gray-50 hover:z-50",
                    "group-hover/dock:[&:not(:hover)]:scale-95 group-hover/dock:[&:not(:hover)]:opacity-70",
                    activeItem === item.label
                      ? "bg-primary text-white shadow-lg shadow-primary/30 z-10 hover:bg-primary"
                      : "text-gray-500 hover:text-gray-900"
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
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">Target 2026</span>
                  <span className="text-[10px] font-black text-primary">₹{formatLakhs(totalEarnings)} / ₹{formatLakhs(targetEarnings)}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                  <div 
                    className="h-full bg-primary transition-all duration-1000 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
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
    </>
  );
}

