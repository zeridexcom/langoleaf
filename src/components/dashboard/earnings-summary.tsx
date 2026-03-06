"use client";

import { Wallet, TrendingUp, Clock, CheckCircle } from "lucide-react";

interface Earning {
  amount: number;
  created_at: string;
}

interface EarningsSummaryProps {
  earnings?: Earning[];
}

export function EarningsSummary({ earnings = [] }: EarningsSummaryProps) {
  // Calculate metrics from real data
  const totalEarned = earnings.reduce((sum, e) => sum + (e.amount || 0), 0);
  const thisMonth = earnings
    .filter(e => {
      const date = new Date(e.created_at);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Earnings Overview</h3>
        <a
          href="/earnings"
          className="text-sm text-[#6d28d9] hover:text-[#a78bfa] transition-colors"
        >
          View Details
        </a>
      </div>

      <div className="space-y-4">
        {/* Total Earned */}
        <div className="p-4 bg-[#252542] rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Total Earned</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">₹{totalEarned.toLocaleString()}</p>
          <p className="text-xs text-emerald-400 mt-1">Lifetime earnings</p>
        </div>

        {/* Pending */}
        <div className="p-4 bg-[#252542] rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">This Month</span>
            <TrendingUp className="w-4 h-4 text-[#22d3ee]" />
          </div>
          <p className="text-2xl font-bold text-white">₹{thisMonth.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{earnings.length} paid commissions</p>
        </div>

        {/* Recent Activity */}
        <div className="p-4 bg-[#252542] rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Recent</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          {earnings.length > 0 ? (
            <div className="space-y-2">
              {earnings.slice(0, 3).map((e, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-400">
                    {new Date(e.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-emerald-400">+₹{e.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No earnings yet</p>
          )}
        </div>
      </div>

      {/* Progress to next tier */}
      <div className="mt-6 p-4 bg-gradient-to-r from-[#6d28d9]/20 to-[#22d3ee]/20 rounded-xl border border-[#6d28d9]/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white font-medium">Bronze Agent</span>
          <span className="text-xs text-gray-400">Start earning to rank up</span>
        </div>
        <div className="w-full bg-[#252542] rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-[#6d28d9] to-[#22d3ee] h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((totalEarned / 100000) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {totalEarned >= 100000 
            ? "You've reached Silver Agent tier!" 
            : `₹${(100000 - totalEarned).toLocaleString()} more to unlock Silver Agent`}
        </p>
      </div>
    </div>
  );
}

