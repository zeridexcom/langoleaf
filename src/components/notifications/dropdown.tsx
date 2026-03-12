"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, CheckCircle, UserPlus, FileCheck, Coins, Award, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const iconMap: Record<string, any> = {
  student_added: UserPlus,
  application_submitted: FileCheck,
  coins_earned: Coins,
  badge_earned: Award,
  action_required: AlertCircle,
  default: CheckCircle,
};

const colorMap: Record<string, string> = {
  student_added: "text-blue-600",
  application_submitted: "text-cyan-600",
  coins_earned: "text-amber-500",
  badge_earned: "text-emerald-600",
  action_required: "text-amber-500",
  default: "text-gray-600",
};

const bgMap: Record<string, string> = {
  student_added: "bg-blue-50",
  application_submitted: "bg-cyan-50",
  coins_earned: "bg-amber-50",
  badge_earned: "bg-emerald-50",
  action_required: "bg-amber-50",
  default: "bg-gray-50",
};

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("freelancer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error fetching notifications:", error);
        return;
      }

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  // Load on mount and when dropdown opens
  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark as read when opening
  const handleOpen = async () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      await fetchNotifications();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors rounded-lg border border-transparent hover:border-gray-200"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full" />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-900">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = iconMap[notification.type] || iconMap.default;
                const colorClass = colorMap[notification.type] || colorMap.default;
                const bgClass = bgMap[notification.type] || bgMap.default;

                return (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${
                      !notification.is_read ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${bgClass} flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${colorClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${!notification.is_read ? "text-gray-900" : "text-gray-600"}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200">
            <a
              href="/notifications"
              className="block w-full text-center py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              View All Notifications
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
