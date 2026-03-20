"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "./admin-layout";
import {
  Bell,
  Send,
  Users,
  Loader2,
  CheckCircle,
  Clock,
  Mail,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface Broadcast {
  id: string;
  title: string;
  message: string;
  type: string;
  sent_at: string;
  recipient_count: number;
}

export function BroadcastsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("announcement");
  const [priority, setPriority] = useState("normal");
  const [targetAudience, setTargetAudience] = useState("all");
  const [sending, setSending] = useState(false);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const supabase = createClient();

  const fetchData = async () => {
    try {
      // Get all freelancers to filter client-side for dynamic audience counts
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, tier_level")
        .eq("role", "freelancer");

      setFreelancers(profiles || []);

      // Get recent broadcasts
      const { data: activities } = await supabase
        .from("activity_feed")
        .select("*")
        .eq("action", "broadcast_sent")
        .order("created_at", { ascending: false })
        .limit(10);

      setBroadcasts(
        (activities || []).map((a) => ({
          id: a.id,
          title: a.metadata?.title || "Untitled",
          message: a.description || "",
          type: a.metadata?.type || "announcement",
          sent_at: a.created_at,
          recipient_count: a.metadata?.recipient_count || 0,
        }))
      );
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getTargetFreelancers = () => {
    if (targetAudience === "all") return freelancers;
    return freelancers.filter(f => (f.tier_level || "bronze") === targetAudience);
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const targetList = getTargetFreelancers();
    if (targetList.length === 0) {
      toast.error("No freelancers found in this target audience.");
      return;
    }

    setSending(true);
    try {
      const notifications = targetList.map((f) => ({
        freelancer_id: f.id,
        type: type,
        title: title,
        message: message,
        data: {
          priority: priority
        },
        is_read: false,
      }));

      const { error: notifError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (notifError) throw notifError;

      // Log broadcast in activity feed
      await supabase.from("activity_feed").insert({
        action: "broadcast_sent",
        entity_type: "broadcast",
        description: message,
        metadata: {
          title: title,
          type: type,
          priority: priority,
          target_audience: targetAudience,
          recipient_count: targetList.length,
        },
      });

      toast.success(`Broadcast sent to ${targetList.length} freelancers!`);
      setTitle("");
      setMessage("");
      fetchData();
    } catch (error: any) {
      console.error("Error sending broadcast:", error);
      toast.error(error.message || "Failed to send broadcast");
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Advanced Broadcasts
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Send targeted mass communications and alerts
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Send Broadcast Form */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 lg:p-8 shadow-sm">
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Send className="w-5 h-5 text-primary" />
                </div>
                Compose Broadcast
              </h2>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Type */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Type
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 appearance-none"
                    >
                      <option value="announcement">📢 Announcement</option>
                      <option value="update">✨ Update</option>
                      <option value="alert">⚠️ Alert</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 appearance-none"
                    >
                      <option value="normal">🟢 Normal</option>
                      <option value="high">🟡 High</option>
                      <option value="urgent">🔴 Urgent</option>
                    </select>
                  </div>

                  {/* Target Audience */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Audience Target
                    </label>
                    <select
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 appearance-none"
                    >
                      <option value="all">🌍 All Freelancers</option>
                      <option value="platinum">👑 Platinum Tier Only</option>
                      <option value="gold">🥇 Gold Tier Only</option>
                      <option value="silver">🥈 Silver Tier Only</option>
                      <option value="bronze">🥉 Bronze Tier Only</option>
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                    Subject / Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter broadcast subject..."
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                    Message Body <span className="text-gray-400 font-normal normal-case">(Markdown supported)</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Compose your message here... Use **bold** or *italics*."
                    rows={6}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-medium leading-relaxed"
                  />
                </div>

                {/* Recipients Info */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-gradient-to-r from-primary/5 to-transparent dark:from-primary/10 rounded-2xl border border-primary/10 dark:border-primary/20 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        Delivery Estimate
                      </p>
                      <p className="text-xs text-gray-500">
                        Will be sent immediately via in-app notification
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-primary">
                      {getTargetFreelancers().length}
                    </span>
                    <span className="text-sm font-bold text-gray-600 dark:text-gray-400 ml-2">
                      Recipients
                    </span>
                  </div>
                </div>

                {/* Send Button */}
                <button
                  onClick={handleSend}
                  disabled={sending || !title.trim() || !message.trim()}
                  className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-sm uppercase tracking-wider rounded-xl hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-xl shadow-gray-200 dark:shadow-none"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Broadcasting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Broadcast
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Recent Broadcasts */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl h-full shadow-sm">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700/50">
                <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <Clock className="w-4 h-4 text-gray-500" />
                  </div>
                  Broadcast History
                </h2>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {loading ? (
                  <div className="p-12 text-center">
                    <Loader2 className="w-6 h-6 mx-auto animate-spin text-primary" />
                  </div>
                ) : broadcasts.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <Bell className="w-10 h-10 mx-auto mb-3 text-gray-200 dark:text-gray-700" />
                    <p className="text-sm font-medium">No broadcasts sent yet</p>
                  </div>
                ) : (
                  broadcasts.map((broadcast) => (
                    <div key={broadcast.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">
                          {broadcast.title}
                        </p>
                        <span
                          className={cn(
                            "px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg flex-shrink-0",
                            broadcast.type === "alert"
                              ? "bg-red-100 text-red-700"
                              : broadcast.type === "update"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          )}
                        >
                          {broadcast.type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
                        {broadcast.message}
                      </p>
                      <div className="flex items-center justify-between text-[11px] font-bold text-gray-400">
                        <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                          <Users className="w-3 h-3" />
                          {broadcast.recipient_count}
                        </span>
                        <span>{new Date(broadcast.sent_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
