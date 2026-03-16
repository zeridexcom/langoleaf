"use client";

import { useState, useEffect } from "react";
import { Wallet, TrendingUp, Download, Calendar, ChevronDown, IndianRupee, Loader2 } from "lucide-react";
import { toast } from "sonner";

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  paid: { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/10", label: "Paid" },
  pending: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/10", label: "Pending" },
  processing: { color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-100 dark:bg-cyan-500/10", label: "Processing" },
  approved: { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/10", label: "Approved" },
};

export default function EarningsPage() {
  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0
  });

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/finance/commissions?limit=50");
      const result = await response.json();
      
      if (result.success) {
        const data = result.data.items || [];
        setCommissions(data);
        
        // Calculate stats
        const total = data.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
        const paid = data.filter((c: any) => c.status === "paid").reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
        const pending = data.filter((c: any) => c.status !== "paid").reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
        
        setStats({ total, paid, pending });
      } else {
        toast.error("Failed to load earnings data");
      }
    } catch (error) {
      console.error("Error fetching earnings:", error);
      toast.error("Internal error loading earnings");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-gray-500 font-medium font-black uppercase tracking-widest text-[10px]">Syncing Financial Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Financial Earnings</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Verified payout history and pending commissions</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-bold text-sm">
            <Calendar className="w-4 h-4" />
            Filters
            <ChevronDown className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-bold text-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Earnings</span>
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white line-height-1">₹{stats.total.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 font-bold uppercase tracking-wider">Historical aggregate</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl">
              <IndianRupee className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Successfully Paid</span>
          </div>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 line-height-1">₹{stats.paid.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 font-bold uppercase tracking-wider">Settled & disbursed</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-500/10 rounded-xl">
              <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Pending Payouts</span>
          </div>
          <p className="text-3xl font-black text-amber-600 dark:text-amber-400 line-height-1">₹{stats.pending.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 font-bold uppercase tracking-wider">Awaiting cycle settlement</p>
        </div>
      </div>

      {/* Earnings Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Ledger Records</h3>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{commissions.length} Entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">ID Reference</th>
                <th className="text-left px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Subject Student</th>
                <th className="text-left px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Type</th>
                <th className="text-left px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Amount</th>
                <th className="text-left px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                <th className="text-left px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Applied Date</th>
              </tr>
            </thead>
            <tbody>
              {commissions.length > 0 ? (
                commissions.map((c) => {
                  const status = statusConfig[c.status] || { color: "text-gray-500", bg: "bg-gray-100", label: c.status };
                  return (
                    <tr key={c.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-gray-400 font-mono">#{c.id.slice(0, 8)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                           <span className="text-sm font-black text-gray-900 dark:text-white capitalize">{c.student?.name || "Student Ref"}</span>
                           <span className="text-[10px] text-gray-400 font-medium">Application Link</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-black text-gray-500 uppercase tracking-wider">Commission</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-gray-900 dark:text-white">₹{c.amount.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-500">
                        {new Date(c.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-black text-xs uppercase tracking-[0.2em]">
                    No financial data found in ledger
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
