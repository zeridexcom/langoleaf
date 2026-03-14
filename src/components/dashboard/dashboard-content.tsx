"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatsCard, MiniStatsCard } from "@/components/ui/stats-card";
import { SkeletonCard } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentStudents } from "@/components/dashboard/recent-students";
import { RecentApplications } from "@/components/dashboard/recent-applications";
import { EarningsSummary } from "@/components/dashboard/earnings-summary";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { LayoutDashboard, Users, FileText, Wallet, TrendingUp, UserPlus } from "lucide-react";

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
      <div className="space-y-6">
        <SkeletonCard />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState
        icon={LayoutDashboard}
        title="Failed to load dashboard"
        description="There was an error loading your dashboard data. Please try again."
        action={{
          label: "Retry",
          onClick: () => window.location.reload(),
        }}
      />
    );
  }

  const stats = data.stats;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's what's happening with your students."
        icon={LayoutDashboard}
        breadcrumbs={[{ label: "Dashboard" }]}
        actions={
          <Button onClick={() => window.location.href = "/students/add"} className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Add Student
          </Button>
        }
      />

      {/* Hero Banner */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-gradient-to-br from-primary/5 to-primary/10 p-8 border border-primary/20 rounded-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <TrendingUp className="w-5 h-5" />
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
          <MiniStatsCard
            label="Commission"
            value={`₹${(stats.totalEarnings || 0).toLocaleString()}`}
            icon={Wallet}
            color="primary"
          />
          <MiniStatsCard
            label="Students"
            value={stats.totalStudents || 0}
            icon={Users}
            color="success"
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Students"
          value={stats.totalStudents || 0}
          icon={Users}
          trend={{ value: 12, isPositive: true, label: "vs last month" }}
          color="primary"
        />
        <StatsCard
          title="Applications"
          value={stats.totalApplications || 0}
          icon={FileText}
          trend={{ value: 8, isPositive: true, label: "vs last month" }}
          color="info"
        />
        <StatsCard
          title="Pending Review"
          value={stats.pendingApplications || 0}
          icon={Wallet}
          trend={{ value: 5, isPositive: false, label: "vs last month" }}
          color="warning"
        />
        <StatsCard
          title="Conversion Rate"
          value={`${stats.conversionRate || 0}%`}
          icon={TrendingUp}
          trend={{ value: 3, isPositive: true, label: "vs last month" }}
          color="success"
        />
      </div>

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
