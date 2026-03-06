"use client";

import { Users, FileCheck, AlertCircle, Wallet, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Stats {
  totalStudents: number;
  totalApplications: number;
  totalEarnings: number;
  pendingApplications: number;
  conversionRate: number;
}

interface StatsCardsProps {
  stats?: Stats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const displayStats = [
    {
      title: "Total Students",
      value: stats?.totalStudents?.toString() || "0",
      change: "Active leads",
      icon: Users,
      color: "text-[#6d28d9]",
      bgColor: "bg-[#6d28d9]/10",
    },
    {
      title: "Applications",
      value: stats?.totalApplications?.toString() || "0",
      change: `${stats?.pendingApplications || 0} pending`,
      icon: FileCheck,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Conversion Rate",
      value: `${stats?.conversionRate?.toFixed(1) || "0"}%`,
      change: "Lead to enrollment",
      icon: TrendingUp,
      color: "text-[#22d3ee]",
      bgColor: "bg-[#22d3ee]/10",
    },
    {
      title: "Total Earnings",
      value: `₹${(stats?.totalEarnings || 0).toLocaleString()}`,
      change: "Lifetime commission",
      icon: Wallet,
      color: "text-[#fbbf24]",
      bgColor: "bg-[#fbbf24]/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {displayStats.map((stat) => (
        <div
          key={stat.title}
          className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-[#2d2d4a] rounded-2xl p-5 hover:border-[#6d28d9]/30 transition-colors shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</h3>
              {stat.change && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{stat.change}</p>
              )}
            </div>
            <div className={cn("p-3 rounded-xl", stat.bgColor)}>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
