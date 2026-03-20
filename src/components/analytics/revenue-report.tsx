"use client";

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart,
  Bar,
  ResponsiveContainer
} from "recharts";
import { ChartContainer } from "./chart-container";

interface RevenueReportProps {
  data: any;
  loading: boolean;
}

export function RevenueReport({ data, loading }: RevenueReportProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        <div className="h-80 bg-gray-100 rounded-2xl" />
        <div className="h-80 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (!data) return null;

  const trendData = (data.byMonth || []).map((item: any) => ({
    name: item.month,
    amount: item.amount
  }));

  const freelancerData = (data.byFreelancer || []).slice(0, 10).map((f: any) => ({
    name: f.name,
    amount: f.amount
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Revenue</p>
          <p className="text-3xl font-black text-gray-900">₹{data.totalRevenue?.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Projected Revenue</p>
          <p className="text-3xl font-black text-emerald-600">₹{data.projectedRevenue?.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Collection Rate</p>
          <p className="text-3xl font-black text-blue-600">{data.collectionRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="Revenue Trend" subtitle="Monthly commission volume">
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
            <Tooltip 
               formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Amount']}
               contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
            />
            <Line type="monotone" dataKey="amount" stroke="#000000" strokeWidth={3} dot={{ r: 4, fill: "#000000" }} activeDot={{ r: 6 }} />
          </LineChart>
        </ChartContainer>

        <ChartContainer title="Revenue by Freelancer" subtitle="Top performing partners">
          <BarChart data={freelancerData}>
             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
             <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
             <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
             <Tooltip 
               formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Amount']}
               contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
            />
            <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}
