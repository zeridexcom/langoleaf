"use client";

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  FunnelChart,
  Funnel,
  LabelList,
  Cell
} from "recharts";
import { ChartContainer } from "./chart-container";

const COLORS = ["#000000", "#111827", "#1f2937", "#374151", "#4b5563", "#6b7280"];

interface PipelineReportProps {
  data: any;
  loading: boolean;
}

export function PipelineReport({ data, loading }: PipelineReportProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        <div className="h-80 bg-gray-100 rounded-2xl" />
        <div className="h-80 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (!data) return null;

  const funnelData = (data.conversionRates || []).filter((s: any) => s.count > 0).map((s: any) => ({
    name: s.stage,
    value: s.count,
    fill: "#000000"
  }));

  const trendData = (data.monthlyTrend || []).map((item: any) => ({
    name: item.month,
    count: item.count
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="Application Funnel" subtitle="Conversion through stages">
          <FunnelChart>
            <Tooltip 
               contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
            />
            <Funnel
              data={funnelData}
              dataKey="value"
            >
              <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
              {funnelData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Funnel>
          </FunnelChart>
        </ChartContainer>

        <ChartContainer title="Application Trend" subtitle="New applications over time">
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#000000" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
               contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
            />
            <Area type="monotone" dataKey="count" stroke="#000000" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      </div>

      {/* Conversion Rate Breakdown */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-lg font-black text-gray-900 mb-4">Stage Conversion Rates</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {data.conversionRates?.map((stage: any) => (
            <div key={stage.stage} className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">{stage.stage}</p>
              <p className="text-xl font-black text-gray-900">{stage.conversionRate}%</p>
              <p className="text-xs text-gray-500 font-medium">{stage.count} students</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
