"use client";

import { useEffect, useState } from "react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentStudents } from "@/components/dashboard/recent-students";
import { RecentApplications } from "@/components/dashboard/recent-applications";
import { EarningsSummary } from "@/components/dashboard/earnings-summary";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { QuickActions } from "@/components/dashboard/quick-actions";

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

const EMPTY_DASHBOARD_DATA: DashboardData = {
  stats: {
    totalStudents: 0,
    totalApplications: 0,
    totalEarnings: 0,
    pendingApplications: 0,
    conversionRate: 0,
  },
  recentStudents: [],
  recentApplications: [],
  earnings: [],
};

export function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        console.error("Dashboard API error:", response.status, response.statusText);
        setData(EMPTY_DASHBOARD_DATA);
        return;
      }

      const result = (await response.json()) as DashboardData;
      setData({
        stats: result?.stats || EMPTY_DASHBOARD_DATA.stats,
        recentStudents: result?.recentStudents || [],
        recentApplications: result?.recentApplications || [],
        earnings: result?.earnings || [],
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setData(EMPTY_DASHBOARD_DATA);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-none h-8 w-8 border-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 font-bold">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner - Professional Rounded */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-white p-8 border border-gray-200 rounded-2xl shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-black uppercase tracking-[0.2em]">Global Career Partner</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
            Level Up Your Earning Potential
          </h1>
          <p className="text-gray-600 max-w-xl text-base font-medium">
            The study abroad market is exploding! Over <span className="text-gray-900 font-black">10 Lakh students</span> in India plan to go abroad yearly. Are you ready to lead?
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-center bg-primary/10 p-4 border border-primary/30 min-w-[120px] rounded-xl">
            <p className="text-[10px] font-black text-primary uppercase">Points</p>
            <p className="text-3xl font-black text-primary">8,450</p>
          </div>
          <div className="text-center bg-gray-50 p-4 border border-gray-200 min-w-[120px] rounded-xl">
            <p className="text-[10px] font-black text-gray-500 uppercase">Status</p>
            <p className="text-3xl font-black text-gray-900">Elite</p>
          </div>
        </div>
      </div>

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
        <RecentApplications applications={data.recentApplications} />
        <ActivityFeed applications={data.recentApplications} />
      </div>
    </div>
  );
}
