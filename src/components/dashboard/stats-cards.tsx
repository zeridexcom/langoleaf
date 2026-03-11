"use client";

import { Users, FileCheck, TrendingUp, Wallet, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useState } from "react";

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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const displayStats = [
    {
      title: "Total Students",
      value: stats?.totalStudents?.toString() || "0",
      change: "Active leads",
      icon: Users,
      number: "01",
    },
    {
      title: "Applications",
      value: stats?.totalApplications?.toString() || "0",
      change: `${stats?.pendingApplications || 0} pending`,
      icon: FileCheck,
      number: "02",
    },
    {
      title: "Conversion Rate",
      value: `${stats?.conversionRate?.toFixed(1) || "0"}%`,
      change: "Lead to enrollment",
      icon: TrendingUp,
      number: "03",
    },
    {
      title: "Total Earnings",
      value: `₹${(stats?.totalEarnings || 0).toLocaleString()}`,
      change: "Lifetime commission",
      icon: Wallet,
      number: "04",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-2 border-black">
      {displayStats.map((stat, index) => (
        <div
          key={stat.title}
          className={cn(
            "bg-white p-6 border-b-2 sm:border-b-0 border-black transition-all duration-150 ease-out cursor-pointer group",
            index < 3 && "sm:border-r-2",
            hoveredIndex === index && "bg-[#FF3000] text-white"
          )}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Top Row - Number and Icon */}
          <div className="flex items-start justify-between mb-6">
            <span className={cn(
              "text-xs font-black tracking-widest uppercase",
              hoveredIndex === index ? "text-white/60" : "text-[#FF3000]"
            )}>
              {stat.number}
            </span>
            <div className={cn(
              "w-10 h-10 border-2 flex items-center justify-center transition-all duration-150",
              hoveredIndex === index 
                ? "border-white bg-white text-[#FF3000]" 
                : "border-black bg-black text-white"
            )}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>

          {/* Value - Massive */}
          <h3 className={cn(
            "text-3xl md:text-4xl font-black tracking-tighter mb-2 transition-transform duration-150",
            hoveredIndex === index && "scale-105"
          )}>
            {stat.value}
          </h3>

          {/* Title - Uppercase */}
          <p className={cn(
            "text-xs font-black uppercase tracking-widest mb-1",
            hoveredIndex === index ? "text-white/80" : "text-black"
          )}>
            {stat.title}
          </p>

          {/* Change - Subtle */}
          <p className={cn(
            "text-xs font-medium",
            hoveredIndex === index ? "text-white/60" : "text-black/50"
          )}>
            {stat.change}
          </p>

          {/* Plus Icon - Rotates on hover */}
          <div className={cn(
            "mt-4 w-8 h-8 border-2 flex items-center justify-center transition-all duration-150",
            hoveredIndex === index 
              ? "border-white rotate-90" 
              : "border-black/20 rotate-0"
          )}>
            <Plus className={cn(
              "w-4 h-4 transition-colors",
              hoveredIndex === index ? "text-white" : "text-black/40"
            )} />
          </div>
        </div>
      ))}
    </div>
  );
}

