"use client";

import { useState } from "react";
import { Wallet, TrendingUp, Download, Calendar, ChevronDown, IndianRupee } from "lucide-react";

const earnings = [
  {
    id: 1,
    studentName: "Rahul Sharma",
    program: "MBA - IIM Bangalore",
    amount: 25000,
    status: "paid",
    date: "2024-01-15",
    type: "Commission",
  },
  {
    id: 2,
    studentName: "Priya Patel",
    program: "B.Tech - IIT Delhi",
    amount: 15000,
    status: "pending",
    date: "2024-01-14",
    type: "Commission",
  },
  {
    id: 3,
    studentName: "Amit Kumar",
    program: "MCA - NIT Trichy",
    amount: 20000,
    status: "paid",
    date: "2024-01-10",
    type: "Commission",
  },
  {
    id: 4,
    studentName: "Sneha Gupta",
    program: "BBA - Christ University",
    amount: 18000,
    status: "processing",
    date: "2024-01-08",
    type: "Commission",
  },
  {
    id: 5,
    studentName: "Vikram Singh",
    program: "MBA - XLRI Jamshedpur",
    amount: 30000,
    status: "paid",
    date: "2024-01-05",
    type: "Commission",
  },
];

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  paid: { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/10", label: "Paid" },
  pending: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/10", label: "Pending" },
  processing: { color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-100 dark:bg-cyan-500/10", label: "Processing" },
};

export default function EarningsPage() {
  const [period, setPeriod] = useState("this_month");

  const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
  const paidEarnings = earnings.filter(e => e.status === "paid").reduce((sum, e) => sum + e.amount, 0);
  const pendingEarnings = earnings.filter(e => e.status === "pending").reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Earnings</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-500 dark:text-gray-400">Track your commissions and payments</p>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest rounded text-center">Sample Data</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Calendar className="w-4 h-4" />
            This Month
            <ChevronDown className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Earnings</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{totalEarnings.toLocaleString()}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Lifetime earnings</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl">
              <IndianRupee className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Paid</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">₹{paidEarnings.toLocaleString()}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Successfully paid</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-500/10 rounded-xl">
              <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Pending</span>
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">₹{pendingEarnings.toLocaleString()}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Awaiting payment</p>
        </div>
      </div>

      {/* Earnings Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Earnings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Student</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Program</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Type</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Amount</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {earnings.map((earning) => {
                const status = statusConfig[earning.status];
                return (
                  <tr key={earning.id} className="border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{earning.studentName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{earning.program}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{earning.type}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">₹{earning.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{earning.date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
