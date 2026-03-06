"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Clock, 
  Activity, 
  TrendingUp, 
  Search,
  Filter,
  Download,
  Eye,
  LogIn,
  LogOut,
  FileText,
  UserPlus,
  DollarSign
} from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface FreelancerActivity {
  id: string;
  freelancer_id: string;
  freelancer_name: string;
  freelancer_email: string;
  activity_type: string;
  page_path: string;
  created_at: string;
  metadata: any;
}

interface FreelancerSession {
  id: string;
  freelancer_id: string;
  freelancer_name: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  pages_visited: number;
  actions_count: number;
  is_active: boolean;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "activities" | "sessions" | "freelancers">("overview");
  const [activities, setActivities] = useState<FreelancerActivity[]>([]);
  const [sessions, setSessions] = useState<FreelancerSession[]>([]);
  const [stats, setStats] = useState({
    totalFreelancers: 0,
    activeNow: 0,
    totalSessions: 0,
    avgSessionTime: 0,
    totalActivities: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("today");

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchAdminData();
  }, [dateFilter]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch activities with freelancer details
      const { data: activitiesData } = await supabase
        .from("freelancer_activities")
        .select(`
          *,
          freelancer:profiles(id, full_name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      // Fetch sessions with freelancer details
      const { data: sessionsData } = await supabase
        .from("freelancer_sessions")
        .select(`
          *,
          freelancer:profiles(id, full_name)
        `)
        .order("started_at", { ascending: false })
        .limit(100);

      // Fetch stats
      const { count: totalFreelancers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: activeNow } = await supabase
        .from("freelancer_sessions")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      const { count: totalSessions } = await supabase
        .from("freelancer_sessions")
        .select("*", { count: "exact", head: true });

      const { count: totalActivities } = await supabase
        .from("freelancer_activities")
        .select("*", { count: "exact", head: true });

      // Calculate average session time
      const { data: avgSession } = await supabase
        .from("freelancer_sessions")
        .select("duration_seconds")
        .not("duration_seconds", "is", null);

      const avgTime = avgSession && avgSession.length > 0
        ? Math.round(avgSession.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) / avgSession.length / 60)
        : 0;

      setActivities(activitiesData?.map((a: any) => ({
        ...a,
        freelancer_name: a.freelancer?.full_name || "Unknown",
        freelancer_email: a.freelancer?.email || "Unknown"
      })) || []);

      setSessions(sessionsData?.map((s: any) => ({
        ...s,
        freelancer_name: s.freelancer?.full_name || "Unknown"
      })) || []);

      setStats({
        totalFreelancers: totalFreelancers || 0,
        activeNow: activeNow || 0,
        totalSessions: totalSessions || 0,
        avgSessionTime: avgTime,
        totalActivities: totalActivities || 0,
        totalEarnings: 0 // Will calculate from commission data
      });

    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "login": return <LogIn className="w-4 h-4 text-green-400" />;
      case "logout": return <LogOut className="w-4 h-4 text-red-400" />;
      case "student_added": return <UserPlus className="w-4 h-4 text-blue-400" />;
      case "application_submitted": return <FileText className="w-4 h-4 text-purple-400" />;
      case "earnings_checked": return <DollarSign className="w-4 h-4 text-yellow-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActivityLabel = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400">Monitor freelancer activities and performance</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6d28d9]"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#6d28d9] text-white rounded-xl hover:bg-[#6d28d9]/90 transition-colors text-sm">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#6d28d9]/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#6d28d9]" />
            </div>
            <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
              {stats.activeNow} active
            </span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalFreelancers}</p>
          <p className="text-sm text-gray-400">Total Freelancers</p>
        </div>

        <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#22d3ee]/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#22d3ee]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{stats.avgSessionTime}m</p>
          <p className="text-sm text-gray-400">Avg. Session Time</p>
        </div>

        <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalActivities}</p>
          <p className="text-sm text-gray-400">Total Activities</p>
        </div>

        <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalSessions}</p>
          <p className="text-sm text-gray-400">Total Sessions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#2d2d4a]">
        {[
          { id: "overview", label: "Overview" },
          { id: "activities", label: "Activities" },
          { id: "sessions", label: "Sessions" },
          { id: "freelancers", label: "Freelancers" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? "text-[#6d28d9] border-[#6d28d9]"
                : "text-gray-400 border-transparent hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6d28d9]"></div>
        </div>
      ) : (
        <>
          {/* Activities Tab */}
          {activeTab === "activities" && (
            <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-[#2d2d4a] flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search activities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#0f0f1a] border border-[#2d2d4a] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6d28d9]"
                  />
                </div>
                <button className="p-2 hover:bg-[#252542] rounded-lg transition-colors">
                  <Filter className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2d2d4a]">
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Freelancer</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Activity</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Page</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities
                      .filter(a => 
                        a.freelancer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        a.activity_type?.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .slice(0, 50)
                      .map((activity) => (
                      <tr key={activity.id} className="border-b border-[#2d2d4a] last:border-0 hover:bg-[#252542]/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#6d28d9]/20 flex items-center justify-center">
                              <span className="text-[#6d28d9] text-sm font-medium">
                                {activity.freelancer_name?.charAt(0) || "?"}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{activity.freelancer_name}</p>
                              <p className="text-xs text-gray-400">{activity.freelancer_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getActivityIcon(activity.activity_type)}
                            <span className="text-sm text-white">{getActivityLabel(activity.activity_type)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">{activity.page_path || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{formatTime(activity.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === "sessions" && (
            <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2d2d4a]">
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Freelancer</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Start Time</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Duration</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Pages</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Actions</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.slice(0, 50).map((session) => (
                      <tr key={session.id} className="border-b border-[#2d2d4a] last:border-0 hover:bg-[#252542]/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#6d28d9]/20 flex items-center justify-center">
                              <span className="text-[#6d28d9] text-sm font-medium">
                                {session.freelancer_name?.charAt(0) || "?"}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-white">{session.freelancer_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">{formatTime(session.started_at)}</td>
                        <td className="px-4 py-3 text-sm text-white">{formatDuration(session.duration_seconds)}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{session.pages_visited}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{session.actions_count}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            session.is_active 
                              ? "bg-green-500/20 text-green-400" 
                              : "bg-gray-500/20 text-gray-400"
                          }`}>
                            {session.is_active ? "Active" : "Ended"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Overview & Freelancers tabs - simplified for now */}
          {(activeTab === "overview" || activeTab === "freelancers") && (
            <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-2xl p-8 text-center">
              <p className="text-gray-400">Detailed {activeTab} analytics coming soon...</p>
              <p className="text-sm text-gray-500 mt-2">Currently showing {activities.length} activities and {sessions.length} sessions</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
