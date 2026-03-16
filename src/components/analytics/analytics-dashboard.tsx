"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Filter, 
  Download, 
  Calendar, 
  Users, 
  TrendingUp, 
  DollarSign,
  Target
} from "lucide-react";
import { OverviewReport } from "./overview-report";
import { PipelineReport } from "./pipeline-report";
import { RevenueReport } from "./revenue-report";
import { PerformanceReport } from "./performance-report";
import { toast } from "sonner";

export function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    loadReport();
  }, [activeTab, filters]);

  const loadReport = async () => {
    setLoading(true);
    try {
      let type = "student_summary";
      if (activeTab === "pipeline") type = "application_pipeline";
      if (activeTab === "revenue") type = "revenue_analysis";
      if (activeTab === "performance") type = "freelancer_performance";
      
      const params = new URLSearchParams({ type, ...filters });
      const response = await fetch(`/api/reports?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setReportData(result.data);
      } else {
        toast.error("Failed to load report data");
      }
    } catch (error) {
       console.error("Error loading report:", error);
       toast.error("Internal error loading reports");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!reportData) return;
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${activeTab}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success("Report data exported as JSON");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-primary" />
            <span className="text-xs font-black text-primary uppercase tracking-[0.2em]">Analytics & Intelligence</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">Performance Overview</h1>
          <p className="text-gray-500 text-sm font-medium">Real-time insights across your student pipeline and revenue</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-900 font-black text-sm rounded-xl hover:bg-gray-50 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Tabs & Filters */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-100 pb-4">
          <TabsList className="bg-gray-100/50 p-1 rounded-xl">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-white data-[state=active]:text-black rounded-lg px-4 py-2 text-sm font-black transition-all"
            >
              <Users className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="pipeline" 
              className="data-[state=active]:bg-white data-[state=active]:text-black rounded-lg px-4 py-2 text-sm font-black transition-all"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger 
              value="revenue" 
              className="data-[state=active]:bg-white data-[state=active]:text-black rounded-lg px-4 py-2 text-sm font-black transition-all"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Financials
            </TabsTrigger>
            <TabsTrigger 
              value="performance" 
              className="data-[state=active]:bg-white data-[state=active]:text-black rounded-lg px-4 py-2 text-sm font-black transition-all"
            >
              <Target className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 w-full lg:w-auto">
             <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-xl">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input 
                  type="date" 
                  className="outline-none text-xs font-bold" 
                  value={filters.startDate}
                  onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
                />
                <span className="text-gray-300">-</span>
                <input 
                  type="date" 
                  className="outline-none text-xs font-bold" 
                  value={filters.endDate}
                  onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
                />
             </div>
             <button className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
                <Filter className="w-4 h-4" />
             </button>
          </div>
        </div>

        <TabsContent value="overview" className="mt-0 focus-visible:outline-none">
          <OverviewReport data={reportData} loading={loading} />
        </TabsContent>

        <TabsContent value="pipeline" className="mt-0 focus-visible:outline-none">
          <PipelineReport data={reportData} loading={loading} />
        </TabsContent>

        <TabsContent value="revenue" className="mt-0 focus-visible:outline-none">
          <RevenueReport data={reportData} loading={loading} />
        </TabsContent>

        <TabsContent value="performance" className="mt-0 focus-visible:outline-none">
          <PerformanceReport data={reportData} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
