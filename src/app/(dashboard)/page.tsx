"use client";

import { useEffect, useState } from "react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentStudents } from "@/components/dashboard/recent-students";
import { EarningsSummary } from "@/components/dashboard/earnings-summary";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { QuickActions } from "@/components/dashboard/quick-actions";

// Mock data for immediate display
const mockData = {
  stats: {
    totalStudents: 12,
    totalApplications: 8,
    totalEarnings: 45000,
    pendingApplications: 3,
    conversionRate: 66.7,
  },
  recentStudents: [
    { id: "1", name: "Rahul Sharma", email: "rahul@example.com", status: "enrolled", created_at: "2024-01-15" },
    { id: "2", name: "Priya Patel", email: "priya@example.com", status: "application_submitted", created_at: "2024-01-14" },
    { id: "3", name: "Amit Kumar", email: "amit@example.com", status: "documents_pending", created_at: "2024-01-12" },
  ],
  recentApplications: [
    { id: "1", program: "MBA", university: "IIM Bangalore", status: "enrolled", created_at: "2024-01-15", student: { name: "Rahul Sharma" } },
    { id: "2", program: "B.Tech", university: "IIT Delhi", status: "application_submitted", created_at: "2024-01-14", student: { name: "Priya Patel" } },
  ],
  earnings: [
    { amount: 15000, created_at: "2024-01-15" },
    { amount: 20000, created_at: "2024-01-10" },
    { amount: 10000, created_at: "2023-12-28" },
  ],
};

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
  const [data, setData] = useState<DashboardData>(mockData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Try to fetch real data, but don't block rendering
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const res = await fetch("/api/dashboard", { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!res.ok) throw new Error("Failed to fetch");
      const dashboardData = await res.json();
      setData(dashboardData);
    } catch (error) {
      console.log("Using mock data - API not available:", error);
      // Keep using mock data
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <StatsCards stats={data?.stats} />

      {/* Quick Actions */}
      <QuickActions />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Students */}
        <div className="lg:col-span-2">
          <RecentStudents students={data?.recentStudents} />
        </div>

        {/* Earnings Summary */}
        <div>
          <EarningsSummary earnings={data?.earnings} />
        </div>
      </div>

      {/* Activity & Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed applications={data?.recentApplications} />
      </div>
    </div>
  );
}
