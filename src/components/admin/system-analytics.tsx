"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  GraduationCap, 
  FileText, 
  TrendingUp, 
  DollarSign,
  Calendar
} from "lucide-react";

interface SystemStats {
  totalFreelancers: number;
  totalStudents: number;
  totalApplications: number;
  totalEnrollments: number;
  totalRevenue: number;
  studentsThisMonth: number;
  applicationsThisMonth: number;
}

const EMPTY_STATS: SystemStats = {
  totalFreelancers: 0,
  totalStudents: 0,
  totalApplications: 0,
  totalEnrollments: 0,
  totalRevenue: 0,
  studentsThisMonth: 0,
  applicationsThisMonth: 0,
};

export function SystemAnalytics() {
  const [stats, setStats] = useState<SystemStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    try {
      const response = await fetch("/api/admin/stats", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch system stats");
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error loading system stats:", error);
      setStats(EMPTY_STATS);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Freelancers",
      value: stats.totalFreelancers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Students",
      value: stats.totalStudents,
      icon: GraduationCap,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Applications",
      value: stats.totalApplications,
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Total Enrollments",
      value: stats.totalEnrollments,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Students This Month",
      value: stats.studentsThisMonth,
      icon: Calendar,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
    {
      title: "Applications This Month",
      value: stats.applicationsThisMonth,
      icon: FileText,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Conversion Rate",
      value: stats.totalApplications > 0 
        ? `${((stats.totalEnrollments / stats.totalApplications) * 100).toFixed(1)}%`
        : "0%",
      icon: TrendingUp,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-black text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Platform Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Freelancer Growth</span>
                <span className="font-bold text-green-600">+12% this month</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Student Acquisition</span>
                <span className="font-bold text-green-600">+24% this month</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Application Rate</span>
                <span className="font-bold text-blue-600">+8% this month</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Revenue Growth</span>
                <span className="font-bold text-emerald-600">+15% this month</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Top Performing Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Enrollment Rate</span>
                  <span className="text-sm font-bold">
                    {stats.totalApplications > 0 
                      ? ((stats.totalEnrollments / stats.totalApplications) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ 
                      width: `${stats.totalApplications > 0 
                        ? (stats.totalEnrollments / stats.totalApplications) * 100 
                        : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Active Freelancers</span>
                  <span className="text-sm font-bold">
                    {stats.totalFreelancers > 0 
                      ? ((stats.totalStudents / stats.totalFreelancers)).toFixed(1)
                      : 0} students/frelancer
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min(
                        (stats.totalStudents / Math.max(stats.totalFreelancers, 1)) * 10, 
                        100
                      )}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
