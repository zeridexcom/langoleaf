"use client";

import { useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notificationKeys } from "./useNotifications";
import type { Notification } from "@/lib/services/notification-service";
import { Bell, User, FileText, CheckCircle, Coins, AlertCircle } from "lucide-react";

// Notification type icons
const notificationIcons: Record<string, React.ReactNode> = {
  student_assigned: <User className="w-4 h-4" />,
  student_created: <User className="w-4 h-4" />,
  application_status_changed: <CheckCircle className="w-4 h-4" />,
  document_uploaded: <FileText className="w-4 h-4" />,
  document_verified: <CheckCircle className="w-4 h-4" />,
  note_added: <Bell className="w-4 h-4" />,
  reminder_due: <AlertCircle className="w-4 h-4" />,
  coins_earned: <Coins className="w-4 h-4" />,
  welcome: <Bell className="w-4 h-4" />,
  system: <AlertCircle className="w-4 h-4" />,
  general: <Bell className="w-4 h-4" />,
};

// Notification type colors
const notificationColors: Record<string, string> = {
  student_assigned: "bg-blue-500",
  student_created: "bg-green-500",
  application_status_changed: "bg-purple-500",
  document_uploaded: "bg-orange-500",
  document_verified: "bg-green-500",
  note_added: "bg-gray-500",
  reminder_due: "bg-red-500",
  coins_earned: "bg-yellow-500",
  welcome: "bg-primary",
  system: "bg-gray-500",
  general: "bg-gray-500",
};

export function useRealtimeNotifications() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const handleNewNotification = useCallback((notification: Notification) => {
    // Invalidate notifications query to refresh the list
    queryClient.invalidateQueries({ queryKey: notificationKeys.all });

    // Play sound notification
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.volume = 0.5;
      audio.play().catch(e => console.log("Audio auto-play blocked by browser:", e));
    } catch (err) {
      console.error("Audio error:", err);
    }

    const isUrgent = notification.data?.priority === "urgent" || notification.data?.priority === "high";

    if (isUrgent) {
      // Show a large, persistent custom toast (Modal-like)
      toast.custom((t) => (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-2xl border-2 border-red-500 w-[400px] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-red-500 animate-pulse" />
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-black text-red-500 uppercase tracking-widest mb-1">Important Broadcast</p>
              <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{notification.title}</h3>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed">
              {notification.message}
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => toast.dismiss(t)}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white text-sm font-bold rounded-xl transition-colors"
            >
              Dismiss
            </button>
            <a 
              href="/notifications"
              onClick={() => toast.dismiss(t)}
              className="flex-1 py-3 text-center bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-colors"
            >
              View in Log
            </a>
          </div>
        </div>
      ), { duration: Number.POSITIVE_INFINITY, position: 'top-center' }); // Show forever until dismissed
    } else {
      // Standard toast for normal notifications
      const icon = notificationIcons[notification.type] || <Bell className="w-4 h-4" />;
      const colorClass = notificationColors[notification.type] || "bg-gray-500";
      
      toast(notification.title, {
        description: notification.message,
        icon: <span className={`${colorClass} text-white p-1 rounded-full`}>{icon}</span>,
        action: notification.link
          ? {
              label: "View",
              onClick: () => {
                window.location.href = notification.link!;
              },
            }
          : undefined,
        duration: 5000,
      });
    }
  }, [queryClient]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create realtime channel for notifications
      channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `freelancer_id=eq.${user.id}`,
          },
          (payload) => {
            const notification = payload.new as Notification;
            handleNewNotification(notification);
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("Realtime notifications subscribed");
          }
          if (status === "CHANNEL_ERROR") {
            console.error("Realtime notifications channel error");
          }
        });
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase, handleNewNotification]);
}

// Hook for marking notifications as read when viewed
export function useMarkNotificationsAsRead() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const markAsRead = useCallback(async (notificationIds: string[]) => {
    if (notificationIds.length === 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", notificationIds)
      .eq("freelancer_id", user.id);

    if (error) {
      console.error("Error marking notifications as read:", error);
      return;
    }

    // Invalidate queries to refresh
    queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  }, [queryClient, supabase]);

  return { markAsRead };
}
