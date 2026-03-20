"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "./admin-layout";
import {
  Users,
  Search,
  Mail,
  Phone,
  GraduationCap,
  FileText,
  DollarSign,
  Calendar,
  User,
  Loader2,
  ExternalLink,
  MoreVertical,
  TrendingUp,
  Award,
  Clock,
  Send,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface Freelancer {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  coins_balance: number;
  tier_level: string;
  total_earnings: number;
  total_students: number;
  created_at: string;
  total_applications?: number;
  active_students?: number;
}

export function AdminFreelancersPage() {
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFreelancer, setSelectedFreelancer] = useState<Freelancer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [freelancerStats, setFreelancerStats] = useState<any>(null);
  const supabase = createClient();

  const fetchFreelancers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          *,
          students(count),
          applications(count)
        `
        )
        .eq("role", "freelancer")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((f: any) => ({
        ...f,
        total_students: f.students?.[0]?.count || 0,
        total_applications: f.applications?.[0]?.count || 0,
      }));

      setFreelancers(formatted);
    } catch (error) {
      console.error("Error fetching freelancers:", error);
      toast.error("Failed to load freelancers");
    } finally {
      setLoading(false);
    }
  };

  const fetchFreelancerDetails = async (freelancerId: string) => {
    try {
      // Get detailed stats
      const { data: students } = await supabase
        .from("students")
        .select("id, name, status, created_at")
        .eq("freelancer_id", freelancerId);

      const { data: applications } = await supabase
        .from("applications")
        .select("id, status, program, university, created_at")
        .eq("freelancer_id", freelancerId);

      const { data: earnings } = await supabase
        .from("coins_history")
        .select("amount, type, reason, created_at")
        .eq("freelancer_id", freelancerId)
        .order("created_at", { ascending: false })
        .limit(10);

      setFreelancerStats({
        students: students || [],
        applications: applications || [],
        earnings: earnings || [],
      });
    } catch (error) {
      console.error("Error fetching freelancer details:", error);
    }
  };

  useEffect(() => {
    fetchFreelancers();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("profiles-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => {
          fetchFreelancers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageTitle, setMessageTitle] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [messagePriority, setMessagePriority] = useState("normal");
  const [sendingMessage, setSendingMessage] = useState(false);

  const filteredFreelancers = freelancers.filter(
    (freelancer) =>
      freelancer.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      freelancer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredFreelancers.map((f) => f.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const handleSendSelectedMessage = async () => {
    if (!messageTitle.trim() || !messageBody.trim() || selectedIds.size === 0) return;
    setSendingMessage(true);
    try {
      const notifications = Array.from(selectedIds).map((freelancerId) => ({
        freelancer_id: freelancerId,
        type: "urgent_message",
        title: messageTitle,
        message: messageBody,
        data: {
          priority: messagePriority
        },
        is_read: false,
      }));

      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) throw error;

      // Log activity
      await supabase.from("activity_feed").insert({
        action: "broadcast_sent",
        entity_type: "broadcast",
        description: messageBody,
        metadata: {
          title: messageTitle,
          type: "announcement",
          priority: messagePriority,
          recipient_count: selectedIds.size,
          custom_selection: true,
        },
      });

      toast.success(`Message sent to ${selectedIds.size} freelancer(s)!`);
      setShowMessageModal(false);
      setMessageTitle("");
      setMessageBody("");
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "platinum":
        return "bg-gradient-to-r from-slate-300 to-slate-400 text-slate-800";
      case "gold":
        return "bg-gradient-to-r from-amber-300 to-amber-400 text-amber-800";
      case "silver":
        return "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700";
      default:
        return "bg-gradient-to-r from-orange-200 to-orange-300 text-orange-800";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Freelancers
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage and track freelancer performance
            </p>
          </div>
          
          <div className="text-sm text-gray-500">
            {freelancers.length} total freelancers
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className={cn(
            "flex items-center gap-3 transition-all duration-300",
            selectedIds.size > 0 ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none absolute right-4"
          )}>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 mr-2">
              {selectedIds.size} selected
            </span>
            <button
              onClick={() => setShowMessageModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-white text-sm font-medium rounded-xl shadow-sm transition-all"
            >
              <Mail className="w-4 h-4" />
              Message Selected
            </button>
          </div>
        </div>

        {/* Freelancers Table */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredFreelancers.length === 0 ? (
            <div className="p-16 text-center">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium text-gray-900 dark:text-white">
                No freelancers found
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {searchQuery ? "Try adjusting your search filters" : "No freelancers registered yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                  <tr>
                    <th className="p-4 w-12 text-center text-gray-500 dark:text-gray-400 font-semibold whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredFreelancers.length && filteredFreelancers.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary transition-all cursor-pointer"
                      />
                    </th>
                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 tracking-wide uppercase text-xs whitespace-nowrap">Freelancer</th>
                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 tracking-wide uppercase text-xs whitespace-nowrap">Tier</th>
                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 tracking-wide uppercase text-xs whitespace-nowrap">Students</th>
                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 tracking-wide uppercase text-xs whitespace-nowrap">Applications</th>
                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 tracking-wide uppercase text-xs whitespace-nowrap">Earnings</th>
                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 tracking-wide uppercase text-xs whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {filteredFreelancers.map((freelancer) => (
                    <tr 
                      key={freelancer.id} 
                      className={cn(
                        "hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors group cursor-pointer",
                        selectedIds.has(freelancer.id) && "bg-primary/[0.02]"
                      )}
                      onClick={(e) => {
                        // Don't open modal if they clicked the checkbox
                        if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return;
                        setSelectedFreelancer(freelancer);
                        fetchFreelancerDetails(freelancer.id);
                        setShowModal(true);
                      }}
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(freelancer.id)}
                          onChange={(e) => handleSelectOne(freelancer.id, e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold overflow-hidden">
                            {freelancer.avatar_url ? (
                              <img src={freelancer.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              (freelancer.full_name || freelancer.email).charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                              {freelancer.full_name || "Unnamed"}
                            </p>
                            <p className="text-xs text-gray-500 max-w-[180px] sm:max-w-xs truncate">
                              {freelancer.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={cn("px-2.5 py-1 text-[11px] font-black uppercase tracking-wider rounded-lg", getTierColor(freelancer.tier_level || "bronze"))}>
                          {freelancer.tier_level || "bronze"}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-300 font-medium">
                        {freelancer.total_students}
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-300 font-medium">
                        {freelancer.total_applications}
                      </td>
                      <td className="p-4 text-gray-900 dark:text-white font-bold">
                        ₹{(freelancer.total_earnings || 0).toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                         <div className="flex justify-end">
                           <button 
                             className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                             onClick={(e) => {
                               e.stopPropagation();
                               setSelectedFreelancer(freelancer);
                               fetchFreelancerDetails(freelancer.id);
                               setShowModal(true);
                             }}
                            >
                             <MoreVertical className="w-4 h-4" />
                           </button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl animate-scale-up">
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Mail className="w-6 h-6 text-primary" /> Send Custom Message
            </h2>
            <p className="text-sm text-gray-500 mb-6 font-medium">
              Sending directly to <span className="text-primary font-bold">{selectedIds.size} selected freelancer(s)</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Priority</label>
                <select 
                  value={messagePriority}
                  onChange={e => setMessagePriority(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 appearance-none"
                >
                  <option value="normal">🟢 Normal</option>
                  <option value="high">🟡 High</option>
                  <option value="urgent">🔴 Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Message Title</label>
                <input
                  type="text"
                  placeholder="e.g. Exclusive Task Opportunity"
                  value={messageTitle}
                  onChange={e => setMessageTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Message Content</label>
                <textarea
                  placeholder="Type your message here..."
                  rows={5}
                  value={messageBody}
                  onChange={e => setMessageBody(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowMessageModal(false)}
                className="flex-[1] px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendSelectedMessage}
                disabled={sendingMessage || !messageTitle.trim() || !messageBody.trim()}
                className="flex-[2] px-4 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
              >
                {sendingMessage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {sendingMessage ? "Sending..." : "Send to Selected"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Freelancer Detail Modal */}
      {showModal && selectedFreelancer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center overflow-hidden shadow-sm">
                  {selectedFreelancer.avatar_url ? (
                    <img src={selectedFreelancer.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-black text-primary">
                      {(selectedFreelancer.full_name || selectedFreelancer.email)
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                    {selectedFreelancer.full_name || "Unnamed Freelancer"}
                  </h2>
                  <p className="text-sm text-gray-500 font-medium bg-gray-100 dark:bg-gray-700/50 inline-block px-3 py-1 rounded-lg mt-2">{selectedFreelancer.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedFreelancer(null);
                  setFreelancerStats(null);
                }}
                className="p-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-2xl p-5 text-center shadow-sm">
                <GraduationCap className="w-6 h-6 mx-auto text-primary mb-3" />
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {selectedFreelancer.total_students}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-1">Students</p>
              </div>
              <div className="bg-white dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-2xl p-5 text-center shadow-sm">
                <FileText className="w-6 h-6 mx-auto text-blue-500 mb-3" />
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {selectedFreelancer.total_applications}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-1">Apps</p>
              </div>
              <div className="bg-white dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-2xl p-5 text-center shadow-sm">
                <DollarSign className="w-6 h-6 mx-auto text-green-500 mb-3" />
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  ₹{(selectedFreelancer.total_earnings || 0).toLocaleString()}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-1">Earned</p>
              </div>
              <div className="bg-white dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-2xl p-5 text-center shadow-sm">
                <Award className="w-6 h-6 mx-auto text-amber-500 mb-3" />
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {selectedFreelancer.coins_balance}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-1">Coins</p>
              </div>
            </div>

            {/* Recent Activity */}
            {freelancerStats && (
              <div className="space-y-6">
                {/* Recent Students */}
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-gray-500 mb-3">
                    Recent Students
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-2xl divide-y divide-gray-100 dark:divide-gray-600 border border-gray-100 dark:border-gray-700">
                    {freelancerStats.students.length === 0 ? (
                      <p className="p-6 text-sm font-medium text-gray-500 text-center">
                        No students yet
                      </p>
                    ) : (
                      freelancerStats.students.slice(0, 5).map((student: any) => (
                        <div
                          key={student.id}
                          className="p-4 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-400" />
                            </div>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              {student.name}
                            </span>
                          </div>
                          <span
                            className={cn(
                              "px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg",
                              student.status === "enrolled"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            )}
                          >
                            {student.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex gap-3">
              <a
                href={`/admin/freelancers/${selectedFreelancer.id}`}
                className="w-full py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-all text-center"
              >
                View Complete Profile
              </a>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
