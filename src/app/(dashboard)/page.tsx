"use client";

import { useEffect, useState } from "react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentStudents } from "@/components/dashboard/recent-students";
import { EarningsSummary } from "@/components/dashboard/earnings-summary";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { createClient } from "@/lib/supabase/client";

interface DashboardData {
  stats: {
    totalStudents: number;
    totalApplications: number;
    totalEarnings: number;
    pendingApplications: number;
    conversionRate: number;
  };
  recentStudents: any[];
  recentApplications: any[];
  earnings: any[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Load students
      const { data: students } = await supabase
        .from("students")
        .select("*")
        .eq("freelancer_id", user.id)
        .order("created_at", { ascending: false });

      // Load applications
      const { data: applications } = await supabase
        .from("applications")
        .select("*, students(name)")
        .eq("freelancer_id", user.id)
        .order("created_at", { ascending: false });

      // Load earnings
      const { data: earnings } = await supabase
        .from("coins_history")
        .select("*")
        .eq("profile_id", user.id)
        .eq("type", "earned")
        .order("created_at", { ascending: false })
        .limit(10);

      // Calculate stats
      const totalStudents = students?.length || 0;
      const totalApplications = applications?.length || 0;
      const pendingApplications = applications?.filter(a => a.status === "application_submitted").length || 0;
      const enrolledApplications = applications?.filter(a => a.status === "enrolled").length || 0;
      const conversionRate = totalApplications > 0 ? (enrolledApplications / totalApplications) * 100 : 0;
      const totalEarnings = earnings?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

      setData({
        stats: {
          totalStudents,
          totalApplications,
          totalEarnings,
          pendingApplications,
          conversionRate: Math.round(conversionRate * 10) / 10,
        },
        recentStudents: students?.slice(0, 5) || [],
        recentApplications: applications?.slice(0, 5) || [],
        earnings: earnings || [],
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6d28d9]"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <StatsCards stats={data.stats} />

      {/* Quick Actions */}
      <QuickActions />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Students */}
        <div className="lg:col-span-2">
          <RecentStudents students={data.recentStudents} />
        </div>

        {/* Earnings Summary */}
        <div>
          <EarningsSummary earnings={data.earnings} />
        </div>
      </div>

      {/* Activity & Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed applications={data.recentApplications} />
      </div>
    </div>
  );
}

