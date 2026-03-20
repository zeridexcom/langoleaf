"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  is_read: boolean;
  priority: "low" | "normal" | "high" | "urgent";
  created_at: string;
}

export interface ActivityItem {
  id: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  description: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  freelancer_id: string;
  freelancer_name: string | null;
  freelancer_email: string | null;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  unread_messages: number;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: "freelancer" | "admin";
  sender_name: string | null;
  message: string;
  attachments: any[];
  is_read: boolean;
  created_at: string;
}

// Hook for real-time admin notifications
export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchNotifications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
      setUnreadCount(data?.filter((n) => !n.is_read).length || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("admin_notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const { error } = await supabase
        .from("admin_notifications")
        .update({ is_read: true })
        .eq("is_read", false);

      if (error) throw error;
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "admin_notifications",
        },
        (payload) => {
          const newNotification = payload.new as AdminNotification;
          setNotifications((prev) => [newNotification, ...prev]);
          if (!newNotification.is_read) {
            setUnreadCount((prev) => prev + 1);
          }
          // Show toast notification
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("admin-notification", {
                detail: newNotification,
              })
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}

// Hook for real-time activity feed
export function useActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchActivities = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc("get_recent_activity", {
        p_limit: 100,
      });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error("Error fetching activity:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();

    const channel = supabase
      .channel("activity-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_feed",
        },
        (payload) => {
          const newActivity = payload.new as ActivityItem;
          setActivities((prev) => [newActivity, ...prev.slice(0, 99)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActivities]);

  return { activities, loading, refresh: fetchActivities };
}

// Hook for real-time support tickets
export function useSupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchTickets = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select(
          `
          *,
          freelancer:profiles!support_tickets_freelancer_id_fkey(full_name, email)
        `
        )
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const formattedTickets = (data || []).map((t: any) => ({
        ...t,
        freelancer_name: t.freelancer?.full_name,
        freelancer_email: t.freelancer?.email,
        unread_messages: 0, // Will be calculated separately
      }));

      setTickets(formattedTickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTicketStatus = useCallback(
    async (ticketId: string, status: SupportTicket["status"]) => {
      try {
        const { error } = await supabase
          .from("support_tickets")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", ticketId);

        if (error) throw error;
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, status } : t))
        );
        return true;
      } catch (error) {
        console.error("Error updating ticket:", error);
        return false;
      }
    },
    []
  );

  useEffect(() => {
    fetchTickets();

    const channel = supabase
      .channel("support-tickets")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_tickets",
        },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTickets]);

  return { tickets, loading, updateTicketStatus, refresh: fetchTickets };
}

// Hook for support messages (chat)
export function useSupportMessages(ticketId: string | null) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const supabase = createClient();

  const fetchMessages = useCallback(async () => {
    if (!ticketId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_messages")
        .select(
          `
          *,
          sender:profiles!support_messages_sender_id_fkey(full_name)
        `
        )
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const formattedMessages = (data || []).map((m: any) => ({
        ...m,
        sender_name: m.sender?.full_name || "Unknown",
      }));

      setMessages(formattedMessages);

      // Mark messages as read
      await supabase
        .from("support_messages")
        .update({ is_read: true })
        .eq("ticket_id", ticketId)
        .eq("sender_type", "freelancer")
        .eq("is_read", false);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  const sendMessage = useCallback(
    async (message: string, attachments: any[] = []) => {
      if (!ticketId || !message.trim()) return false;

      setSending(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return false;

        const { error } = await supabase.from("support_messages").insert({
          ticket_id: ticketId,
          sender_id: user.id,
          sender_type: "admin",
          message: message.trim(),
          attachments,
        });

        if (error) throw error;

        // Update ticket updated_at
        await supabase
          .from("support_tickets")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", ticketId);

        return true;
      } catch (error) {
        console.error("Error sending message:", error);
        return false;
      } finally {
        setSending(false);
      }
    },
    [ticketId]
  );

  useEffect(() => {
    if (!ticketId) {
      setMessages([]);
      return;
    }

    fetchMessages();

    const channel = supabase
      .channel(`support-messages-${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          const newMessage = payload.new as SupportMessage;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, fetchMessages]);

  return { messages, loading, sending, sendMessage, refresh: fetchMessages };
}

// Hook for real-time stats
export function useAdminStats() {
  const [stats, setStats] = useState({
    totalFreelancers: 0,
    totalStudents: 0,
    totalApplications: 0,
    totalEnrollments: 0,
    totalRevenue: 0,
    studentsThisMonth: 0,
    applicationsThisMonth: 0,
    pendingDocuments: 0,
    openTickets: 0,
    unreadNotifications: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchStats = useCallback(async () => {
    try {
      // Fetch system analytics
      const { data: analyticsData, error: analyticsError } = await supabase.rpc(
        "get_system_analytics"
      );

      if (analyticsError) throw analyticsError;

      const analytics = analyticsData?.[0] || {};

      // Fetch pending documents count
      const { count: pendingDocs } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Fetch open tickets count
      const { count: openTickets } = await supabase
        .from("support_tickets")
        .select("*", { count: "exact", head: true })
        .in("status", ["open", "in_progress"]);

      // Fetch unread notifications count
      const { count: unreadNotifications } = await supabase
        .from("admin_notifications")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);

      setStats({
        totalFreelancers: analytics.total_freelancers || 0,
        totalStudents: analytics.total_students || 0,
        totalApplications: analytics.total_applications || 0,
        totalEnrollments: analytics.total_enrollments || 0,
        totalRevenue: analytics.total_revenue || 0,
        studentsThisMonth: analytics.students_this_month || 0,
        applicationsThisMonth: analytics.applications_this_month || 0,
        pendingDocuments: pendingDocs || 0,
        openTickets: openTickets || 0,
        unreadNotifications: unreadNotifications || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);

    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, loading, refresh: fetchStats };
}
