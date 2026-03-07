"use client";

import { useEffect, useState } from "react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentStudents } from "@/components/dashboard/recent-students";
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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-dark-surface p-8 border-2 border-dark-border rounded-2xl shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-black uppercase tracking-[0.2em]">Global Career Partner</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
            Level Up Your Earning Potential
          </h1>
          <p className="text-slate-400 max-w-xl text-base font-medium">
            The study abroad market is exploding! Over <span className="text-white font-black">10 Lakh students</span> in India plan to go abroad yearly. Are you ready to lead?
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-center bg-primary/10 p-4 border-2 border-primary/30 min-w-[120px] rounded-xl">
            <p className="text-[10px] font-black text-primary uppercase">Points</p>
            <p className="text-3xl font-black text-primary">8,450</p>
          </div>
          <div className="text-center bg-dark-elevated p-4 border-2 border-dark-border min-w-[120px] rounded-xl">
            <p className="text-[10px] font-black text-slate-500 uppercase">Status</p>
            <p className="text-3xl font-black text-white">Elite</p>
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
        <ActivityFeed applications={data.recentApplications} />
      </div>

      {/* Language Course Cards - Professional Rounded */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-dark-surface p-5 border-2 border-dark-border hover:border-primary/50 transition-all cursor-default group hover:translate-x-1 hover:translate-y-1 hover:shadow-2xl shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-primary/20 text-primary border-2 border-primary/30 rounded-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-[9px] font-black py-1 px-2 bg-slate-800 text-slate-400 uppercase tracking-wider">30-45 DAYS</span>
          </div>
          <h3 className="font-black text-base text-white">IELTS English</h3>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Key to UK, CAN, AUS, USA visas. Essential for Study & PR.</p>
          <div className="mt-4 pt-3 border-t-2 border-dark-border flex justify-between items-center">
            <span className="text-[9px] font-black text-slate-500 uppercase">DEMAND</span>
            <div className="flex gap-0.5">
              <div className="w-2 h-2 bg-primary"></div>
              <div className="w-2 h-2 bg-primary"></div>
              <div className="w-2 h-2 bg-primary"></div>
              <div className="w-2 h-2 bg-primary"></div>
              <div className="w-2 h-2 bg-slate-700"></div>
            </div>
          </div>
        </div>

        <div className="bg-dark-surface p-5 border-2 border-dark-border hover:border-primary/50 transition-all cursor-default group hover:translate-x-1 hover:translate-y-1 hover:shadow-2xl shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-green-500/20 text-green-400 border-2 border-green-500/30 rounded-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-[9px] font-black py-1 px-2 bg-green-500/20 text-green-400 uppercase tracking-wider">FREE</span>
          </div>
          <h3 className="font-black text-base text-white">German (A1-B2)</h3>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Huge demand for workers & students. Fastest path to Residency.</p>
          <div className="mt-4 pt-3 border-t-2 border-dark-border flex justify-between items-center">
            <span className="text-[9px] font-black text-slate-500 uppercase">DEMAND</span>
            <div className="flex gap-0.5">
              <div className="w-2 h-2 bg-primary"></div>
              <div className="w-2 h-2 bg-primary"></div>
              <div className="w-2 h-2 bg-primary"></div>
              <div className="w-2 h-2 bg-primary"></div>
              <div className="w-2 h-2 bg-primary"></div>
            </div>
          </div>
        </div>

        <div className="bg-dark-surface p-5 border-2 border-dark-border hover:border-primary/50 transition-all cursor-default group hover:translate-x-1 hover:translate-y-1 hover:shadow-2xl shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-primary/20 text-primary border-2 border-primary/30 rounded-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.553-.894L15 7m0 13V7" />
              </svg>
            </div>
            <span className="text-[9px] font-black py-1 px-2 bg-slate-800 text-slate-400 uppercase tracking-wider">29 CTYS</span>
          </div>
          <h3 className="font-black text-base text-white">French (A1-B2)</h3>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Quebec, France, Switzerland. Multiplies career options.</p>
          <div className="mt-4 pt-3 border-t-2 border-dark-border flex justify-between items-center">
            <span className="text-[9px] font-black text-slate-500 uppercase">DEMAND</span>
            <div className="flex gap-0.5">
              <div className="w-2 h-2 bg-primary"></div>
              <div className="w-2 h-2 bg-primary"></div>
              <div className="w-2 h-2 bg-primary"></div>
              <div className="w-2 h-2 bg-slate-700"></div>
              <div className="w-2 h-2 bg-slate-700"></div>
            </div>
          </div>
        </div>

        <div className="bg-dark-surface p-5 border-2 border-dark-border hover:border-primary/50 transition-all cursor-default group hover:translate-x-1 hover:translate-y-1 hover:shadow-2xl shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-rose-500/20 text-rose-400 border-2 border-rose-500/30 rounded-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <span className="text-[9px] font-black py-1 px-2 bg-slate-800 text-slate-400 uppercase tracking-wider">US ACAD</span>
          </div>
          <h3 className="font-black text-base text-white">TOEFL Prep</h3>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Preferred by Ivy Leagues and Top USA Universities.</p>
          <div className="mt-4 pt-3 border-t-2 border-dark-border flex justify-between items-center">
            <span className="text-[9px] font-black text-slate-500 uppercase">DEMAND</span>
            <div className="flex gap-0.5">
              <div className="w-2 h-2 bg-primary"></div>
              <div className="w-2 h-2 bg-primary"></div>
              <div className="w-2 h-2 bg-primary"></div>
              <div className="w-2 h-2 bg-slate-700"></div>
              <div className="w-2 h-2 bg-slate-700"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
