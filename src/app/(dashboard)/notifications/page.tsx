"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Trash2, UserPlus, FileCheck, Coins, Award, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const iconMap: Record<string, any> = {
  student_added: { icon: UserPlus, color: "text-primary", bgColor: "bg-primary/10" },
  application_submitted: { icon: FileCheck, color: "text-cyan-600", bgColor: "bg-cyan-100" },
  coins_earned: { icon: Coins, color: "text-amber-600", bgColor: "bg-amber-100" },
  badge_earned: { icon: Award, color: "text-emerald-600", bgColor: "bg-emerald-100" },
  action_required: { icon: AlertCircle, color: "text-amber-600", bgColor: "bg-amber-100" },
  application_approved: { icon: CheckCircle, color: "text-emerald-600", bgColor: "bg-emerald-100" },
  default: { icon: Bell, color: "text-gray-600", bgColor: "bg-gray-100" }
};

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from("notifications")
        .select("*")
        .eq("freelancer_id", user.id)
        .order("created_at", { ascending: false });

      if (filter === "unread") {
        query = query.eq("read", false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("freelancer_id", user.id)
        .eq("read", false);

      if (error) throw error;
      toast.success("All notifications marked as read");
      fetchNotifications();
    } catch (error) {
      toast.error("Failed to update notifications");
    }
  };

  const clearAll = async () => {
    try {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return;

       const { error } = await supabase
         .from("notifications")
         .delete()
         .eq("freelancer_id", user.id);

       if (error) throw error;
       toast.success("All notifications cleared");
       setNotifications([]);
    } catch (error) {
      toast.error("Failed to clear notifications");
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Intelligence Log</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium text-sm">
            You have {unreadCount} unread signal{unreadCount !== 1 ? 's' : ''} detected
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 text-xs text-gray-500 font-black uppercase tracking-widest hover:text-primary transition-colors hover:bg-primary/5 rounded-xl border border-transparent hover:border-primary/10"
          >
            <Check className="w-4 h-4" />
            Clear Pending
          </button>
          <button 
            onClick={clearAll}
            className="flex items-center gap-2 px-4 py-2 text-xs text-red-500 font-black uppercase tracking-widest hover:bg-red-50 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Wipe Stream
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={() => setFilter("all")}
          className={`px-6 py-3 text-xs font-black uppercase tracking-[0.2em] border-b-2 transition-all ${
            filter === "all"
              ? "text-primary border-primary"
              : "text-gray-400 border-transparent hover:text-gray-600"
          }`}
        >
          All Activity
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-6 py-3 text-xs font-black uppercase tracking-[0.2em] border-b-2 transition-all flex items-center gap-2 ${
            filter === "unread"
              ? "text-primary border-primary"
              : "text-gray-400 border-transparent hover:text-gray-600"
          }`}
        >
          Live Signals
          {unreadCount > 0 && (
            <span className="bg-primary text-white px-1.5 py-0.5 rounded-full text-[8px] font-black">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
             <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
             </div>
        ) : notifications.length > 0 ? (
          notifications.map((n) => {
            const config = iconMap[n.type] || iconMap.default;
            return (
              <div
                key={n.id}
                className={`flex items-start gap-4 p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl hover:bg-gray-50/50 transition-all group ${
                  !n.read ? "border-l-4 border-l-primary shadow-sm" : "opacity-80"
                }`}
              >
                <div className={`p-3 rounded-xl ${config.bgColor} flex-shrink-0 transition-transform group-hover:scale-110`}>
                  <config.icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className={`text-sm font-black ${!n.read ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>
                        {n.title}
                      </h3>
                      <p className="text-sm text-gray-500 font-medium mt-1 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mt-3">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5 animate-pulse" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20">
            <Bell className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">No activity signals found</p>
          </div>
        )}
      </div>
    </div>
  );
}
