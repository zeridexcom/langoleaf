"use client";

import { useState, useEffect } from "react";
import { 
  Bell, Check, Trash2, UserPlus, FileCheck, Coins, Award, 
  AlertCircle, CheckCircle, Loader2, MessageSquare, ExternalLink, 
  X, Info, Send
} from "lucide-react";
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
  urgent_message: { icon: Send, color: "text-red-500", bgColor: "bg-red-50" },
  default: { icon: Bell, color: "text-gray-600", bgColor: "bg-gray-100" }
};

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
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
        query = query.eq("is_read", false);
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

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      toast.error("Failed to update notification");
    }
  };

  const markAllRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("freelancer_id", user.id)
        .eq("is_read", false);

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
      toast.error("Policy Restriction: Database DELETE policy missing. Please run the SQL fix script.");
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
              Intelligence <span className="text-primary">Log</span>
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
            Operational dashboard for your signals and broadcasts
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={markAllRead}
            className="flex items-center gap-2.5 px-6 py-3 bg-white dark:bg-gray-800 text-sm font-black uppercase tracking-widest text-gray-700 dark:text-gray-200 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-primary/5 transition-all shadow-sm"
          >
            <Check className="w-4 h-4 text-primary" />
            Sync All
          </button>
          <button 
            onClick={clearAll}
            className="flex items-center gap-2.5 px-6 py-3 bg-red-50 dark:bg-red-900/20 text-sm font-black uppercase tracking-widest text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-900/30 hover:bg-red-100 transition-all shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            Purge
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-6 mb-8 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={() => setFilter("all")}
          className={`pb-4 text-xs font-black uppercase tracking-[0.2em] border-b-2 transition-all ${
            filter === "all"
              ? "text-primary border-primary"
              : "text-gray-400 border-transparent hover:text-gray-600"
          }`}
        >
          All Intel
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`pb-4 text-xs font-black uppercase tracking-[0.2em] border-b-2 transition-all flex items-center gap-2 ${
            filter === "unread"
              ? "text-primary border-primary"
              : "text-gray-400 border-transparent hover:text-gray-600"
          }`}
        >
          Unread Signals
          {unreadCount > 0 && (
            <span className="bg-primary text-white px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 animate-pulse">Decrypting Feed...</p>
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((n) => {
            const config = iconMap[n.type] || iconMap.default;
            const isUrgent = n.data?.priority === 'urgent' || n.data?.priority === 'high';
            
            return (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.is_read) markAsRead(n.id);
                  setSelectedNotification(n);
                }}
                className={`relative group flex items-start gap-4 p-6 bg-white dark:bg-gray-900 border transition-all cursor-pointer rounded-3xl ${
                  !n.is_read 
                    ? `border-l-8 ${isUrgent ? 'border-red-500 shadow-lg shadow-red-500/10' : 'border-primary shadow-md'} border-gray-200 dark:border-gray-700` 
                    : "border-gray-100 dark:border-gray-800 opacity-70 translate-x-0"
                } hover:shadow-xl hover:-translate-y-1`}
              >
                <div className={`p-4 rounded-2xl ${config.bgColor} flex-shrink-0 transition-transform group-hover:rotate-6`}>
                  <config.icon className={`w-6 h-6 ${config.color}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {isUrgent && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-tighter rounded-full">
                            Urgent
                          </span>
                        )}
                        <h3 className={`text-lg font-black tracking-tight ${!n.is_read ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>
                          {n.title}
                        </h3>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                      <div className="flex items-center gap-4 mt-4">
                        <span className="text-[11px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                          Detected {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </span>
                        {!n.is_read && (
                          <span className="flex items-center gap-1 text-[11px] text-primary font-black uppercase">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                            Active Signal
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button className="p-2 text-gray-400 hover:text-primary transition-colors">
                        <Info className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-gray-50 dark:bg-gray-800/50 rounded-[40px] border-2 border-dashed border-gray-200 dark:border-gray-700">
            <div className="w-20 h-20 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow-inner mb-6">
              <Bell className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Clean Frequency</h3>
            <p className="text-gray-500 font-medium max-w-xs uppercase tracking-widest text-[10px]">
              No active intelligence signals detected in your current sector
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className={`p-8 pb-4 flex items-center justify-between ${selectedNotification.data?.priority === 'urgent' ? 'bg-red-50 dark:bg-red-900/10' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                  {(() => {
                    const config = iconMap[selectedNotification.type] || iconMap.default;
                    return <config.icon className={`w-6 h-6 ${config.color}`} />;
                  })()}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Signal Brief</h2>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Ref ID: {selectedNotification.id.split('-')[0]}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedNotification(null)}
                className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedNotification.title}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-5 rounded-3xl border border-gray-100 dark:border-gray-800">
                  {selectedNotification.message}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    toast.info("Connecting to secure admin channel...");
                    setSelectedNotification(null);
                  }}
                  className="flex items-center justify-center gap-2 py-4 px-6 bg-white dark:bg-gray-800 border-2 border-primary/20 text-primary font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-primary/5 hover:border-primary transition-all shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  Contact Admin
                </button>
                {selectedNotification.link && (
                  <a
                    href={selectedNotification.link}
                    className="flex items-center justify-center gap-2 py-4 px-6 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Details
                  </a>
                )}
                {!selectedNotification.link && (
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="flex items-center justify-center gap-2 py-4 px-6 bg-gray-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-black transition-all"
                  >
                    Acknowledged
                  </button>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between text-gray-400">
               <span className="text-[10px] font-black uppercase tracking-widest">
                 System Generated @ {new Date(selectedNotification.created_at).toLocaleTimeString()}
               </span>
               <span className="text-[10px] bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full font-black uppercase">
                 Internal Sec-01
               </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
