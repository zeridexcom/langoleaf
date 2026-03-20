"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "./admin-layout";
import { useAdminStats, useActivityFeed } from "@/hooks/useAdminRealtime";
import {
  Users,
  GraduationCap,
  FileText,
  TrendingUp,
  DollarSign,
  Calendar,
  Upload,
  MessageSquare,
  Bell,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  User,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function AdminDashboard() {
  const { stats, loading: statsLoading } = useAdminStats();
  const { activities, loading: activitiesLoading } = useActivityFeed();
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [recentFreelancers, setRecentFreelancers] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecentData = async () => {
      try {
        const supabase = (await import("@/lib/supabase/client")).createClient();

        // Fetch recent applications
        const { data: apps } = await supabase
          .from("applications")
          .select(
            `
            id,
            program,
            university,
            status,
            created_at,
            student:students(name),
            freelancer:profiles!applications_freelancer_id_fkey(full_name, email)
          `
          )
          .order("created_at", { ascending: false })
          .limit(5);

        setRecentApplications(apps || []);

        // Fetch recent freelancers
        const { data: freelancers } = await supabase
          .from("profiles")
          .select("id, email, full_name, created_at")
          .eq("role", "freelancer")
          .order("created_at", { ascending: false })
          .limit(5);

        setRecentFreelancers(freelancers || []);

        // Fetch last 30 days data for charts
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: recentStudents } = await supabase
          .from("students")
          .select("created_at")
          .gte("created_at", thirtyDaysAgo.toISOString());

        const { data: recentAppsForChart } = await supabase
          .from("applications")
          .select("created_at")
          .gte("created_at", thirtyDaysAgo.toISOString());

        // Process data into daily counts
        const dailyData: Record<string, { date: string; students: number; applications: number }> = {};
        
        // Initialize last 30 days
        for (let i = 29; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          dailyData[dateStr] = { date: dateStr, students: 0, applications: 0 };
        }

        (recentStudents || []).forEach((s: any) => {
          const dateStr = new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (dailyData[dateStr]) dailyData[dateStr].students += 1;
        });

        (recentAppsForChart || []).forEach((a: any) => {
          const dateStr = new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (dailyData[dateStr]) dailyData[dateStr].applications += 1;
        });

        setChartData(Object.values(dailyData));
      } catch (error) {
        console.error("Error fetching recent data:", error);
      }
    };

    fetchRecentData();
  }, []);

  const statCards = [
    {
      title: "Total Freelancers",
      value: stats.totalFreelancers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "+12%",
      changeType: "up",
    },
    {
      title: "Total Students",
      value: stats.totalStudents,
      icon: GraduationCap,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: "+24%",
      changeType: "up",
    },
    {
      title: "Total Applications",
      value: stats.totalApplications,
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "+8%",
      changeType: "up",
    },
    {
      title: "Total Enrollments",
      value: stats.totalEnrollments,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      change: "+15%",
      changeType: "up",
    },
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      change: "+18%",
      changeType: "up",
    },
    {
      title: "Students This Month",
      value: stats.studentsThisMonth,
      icon: Calendar,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      change: "+32%",
      changeType: "up",
    },
    {
      title: "Pending Documents",
      value: stats.pendingDocuments,
      icon: Upload,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      urgent: stats.pendingDocuments > 10,
    },
    {
      title: "Open Tickets",
      value: stats.openTickets,
      icon: MessageSquare,
      color: "text-red-600",
      bgColor: "bg-red-50",
      urgent: stats.openTickets > 5,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard Overview
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Real-time analytics and system status
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className={cn(
                  "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 transition-all hover:shadow-lg",
                  stat.urgent && "ring-2 ring-amber-400"
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {statsLoading ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        stat.value
                      )}
                    </p>
                    {stat.change && (
                      <div className="flex items-center gap-1 mt-1">
                        {stat.changeType === "up" ? (
                          <ArrowUpRight className="w-3 h-3 text-green-500" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 text-red-500" />
                        )}
                        <span
                          className={cn(
                            "text-xs font-medium",
                            stat.changeType === "up"
                              ? "text-green-500"
                              : "text-red-500"
                          )}
                        >
                          {stat.change}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={cn("p-3 rounded-xl", stat.bgColor)}>
                    <Icon className={cn("w-5 h-5", stat.color)} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Growth Chart */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Platform Growth</h2>
              <p className="text-sm text-gray-500 font-medium">30-day applications and enrollments overview</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
              <div className="flex items-center gap-1.5 border border-gray-100 dark:border-gray-700 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                New Students
              </div>
              <div className="flex items-center gap-1.5 border border-gray-100 dark:border-gray-700 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                Applications
              </div>
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }} dy={10} minTickGap={20} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="students" name="New Students" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorStudents)" />
                <Area type="monotone" dataKey="applications" name="Applications" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorApps)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Applications */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900 dark:text-white">
                  Recent Applications
                </h2>
                <a
                  href="/admin/applications"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  View all <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {recentApplications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No applications yet</p>
                </div>
              ) : (
                recentApplications.map((app) => (
                  <div key={app.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {app.student?.name || "Unknown Student"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {app.program} • {app.university}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={cn(
                            "inline-flex px-2 py-1 text-xs font-medium rounded-full",
                            app.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : app.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : app.status === "enrolled"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                          )}
                        >
                          {app.status || "submitted"}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">
                          by {app.freelancer?.full_name || app.freelancer?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900 dark:text-white">
                  Live Activity
                </h2>
                <div className="flex items-center gap-1 text-xs text-green-500">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Live
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-96 overflow-y-auto">
              {activitiesLoading ? (
                <div className="p-8 text-center">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300 animate-pulse" />
                  <p className="text-sm text-gray-500">Loading activity...</p>
                </div>
              ) : activities.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                activities.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                        {activity.user_name ? (
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            {activity.user_name.charAt(0).toUpperCase()}
                          </span>
                        ) : (
                          <User className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white">
                          <span className="font-medium">
                            {activity.user_name || activity.user_email || "System"}
                          </span>
                          <span className="text-gray-500 ml-1">
                            {getActionText(activity.action)}
                          </span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatTimeAgo(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Freelancers */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 dark:text-white">
                New Freelancers
              </h2>
              <a
                href="/admin/freelancers"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View all <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Freelancer
                  </th>
                  <th className="text-left py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="text-right py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {recentFreelancers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No freelancers yet</p>
                    </td>
                  </tr>
                ) : (
                  recentFreelancers.map((freelancer) => (
                    <tr
                      key={freelancer.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {(freelancer.full_name || freelancer.email)
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {freelancer.full_name || "Unnamed"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-sm text-gray-500">
                        {freelancer.email}
                      </td>
                      <td className="py-3 px-5 text-sm text-gray-500">
                        {new Date(freelancer.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <a
                          href={`/admin/freelancers/${freelancer.id}`}
                          className="text-sm text-primary hover:underline"
                        >
                          View Profile
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// Helper functions
function getActionText(action: string): string {
  const actions: Record<string, string> = {
    application_submitted: "submitted an application",
    document_uploaded: "uploaded a document",
    freelancer_registered: "joined as a freelancer",
    student_added: "added a new student",
    status_changed: "updated status",
    message_sent: "sent a message",
  };
  return actions[action] || action.replace(/_/g, " ");
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
