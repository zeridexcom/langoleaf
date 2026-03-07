"use client";

import { Users, FileCheck, TrendingUp, Wallet } from "lucide-react";
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
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/30",
    },
    {
      title: "Applications",
      value: stats?.totalApplications?.toString() || "0",
      change: `${stats?.pendingApplications || 0} pending`,
      icon: FileCheck,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
    },
    {
      title: "Conversion Rate",
      value: `${stats?.conversionRate?.toFixed(1) || "0"}%`,
      change: "Lead to enrollment",
      icon: TrendingUp,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
    },
    {
      title: "Total Earnings",
      value: `₹${(stats?.totalEarnings || 0).toLocaleString()}`,
      change: "Lifetime commission",
      icon: Wallet,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {displayStats.map((stat) => (
        <div
          key={stat.title}
          className="bg-dark-surface border-2 border-dark-border p-5 hover:border-primary/50 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[2px_2px_0px_0px_rgba(236,91,19,0.3)] hover:translate-x-0.5 hover:translate-y-0.5"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-wider">{stat.title}</p>
              <h3 className="text-2xl font-black text-white mt-2">{stat.value}</h3>
              {stat.change && (
                <p className="text-[10px] text-slate-400 mt-1 font-medium">{stat.change}</p>
              )}
            </div>
            <div className={cn("p-2.5 border-2", stat.bgColor, stat.borderColor)}>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

