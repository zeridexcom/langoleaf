"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Users,
  FileText,
  GraduationCap,
  MessageSquare,
  Bell,
  Settings,
  Shield,
  ClipboardList,
  Activity,
  Upload,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAdminNotifications } from "@/hooks/useAdminRealtime";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  {
    name: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
    description: "Dashboard overview & analytics",
  },
  {
    name: "Applications",
    href: "/admin/applications",
    icon: FileText,
    description: "Manage student applications",
  },
  {
    name: "Freelancers",
    href: "/admin/freelancers",
    icon: Users,
    description: "Freelancer CRM",
  },
  {
    name: "Students",
    href: "/admin/students",
    icon: GraduationCap,
    description: "Student management",
  },
  {
    name: "Documents",
    href: "/admin/documents",
    icon: Upload,
    description: "Document verification",
  },
  {
    name: "Support",
    href: "/admin/support",
    icon: MessageSquare,
    description: "Live support chat",
  },
  {
    name: "Activity",
    href: "/admin/activity",
    icon: Activity,
    description: "Real-time activity feed",
  },
  {
    name: "Broadcasts",
    href: "/admin/broadcasts",
    icon: Bell,
    description: "Send notifications",
  },
  {
    name: "Tasks",
    href: "/admin/tasks",
    icon: ClipboardList,
    description: "Task verification",
  },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const { unreadCount, notifications } = useAdminNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const getAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        if (profile?.full_name) {
          setAdminName(profile.full_name);
        }
      }
    };
    getAdmin();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {children}
      <NotificationToasts />
    </>
  );
}

// Toast notification component
function NotificationToasts() {
  const [toasts, setToasts] = useState<
    Array<{ id: string; notification: any }>
  >([]);

  useEffect(() => {
    const handler = (event: CustomEvent) => {
      const notification = event.detail;
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, notification }]);

      // Auto remove after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    };

    window.addEventListener("admin-notification", handler as EventListener);
    return () => {
      window.removeEventListener("admin-notification", handler as EventListener);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(({ id, notification }) => (
        <div
          key={id}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-4 max-w-sm animate-slide-in"
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                notification.priority === "urgent"
                  ? "bg-red-500"
                  : notification.priority === "high"
                  ? "bg-orange-500"
                  : "bg-primary"
              )}
            />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {notification.title}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {notification.message}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
