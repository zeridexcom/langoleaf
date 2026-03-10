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
    <div className="bg-white border border-gray-200 p-6 shadow-sm rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-black text-gray-900 uppercase tracking-wide">Earnings Overview</h3>
        <a
          href="/earnings"
          className="text-xs font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
        >
          View Details
        </a>
      </div>

      <div className="space-y-3">
        {/* Total Earned */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Total Earned</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-gray-900">₹{totalEarned.toLocaleString()}</p>
          <p className="text-[10px] text-emerald-600 mt-1 font-medium">Lifetime earnings</p>
        </div>

        {/* This Month */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-gray-500 uppercase tracking-wider">This Month</span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-gray-900">₹{thisMonth.toLocaleString()}</p>
          <p className="text-[10px] text-gray-500 mt-1 font-medium">{earnings.length} paid commissions</p>
        </div>

        {/* Recent Activity */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Recent</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          {earnings.length > 0 ? (
            <div className="space-y-2">
              {earnings.slice(0, 3).map((e, i) => (
                <div key={i} className="flex justify-between text-sm border-b border-gray-200 last:border-0 pb-2 last:pb-0">
                  <span className="text-gray-500 text-xs font-medium">
                    {new Date(e.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-emerald-600 font-black text-xs">+₹{e.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 font-medium">No earnings yet</p>
          )}
        </div>
      </div>

      {/* Progress to next tier */}
      <div className="mt-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-black text-gray-900 uppercase tracking-wide">Bronze Agent</span>
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Rank Up</span>
        </div>
        <div className="w-full bg-gray-200 border border-gray-300 h-3 rounded-full">
          <div 
            className="bg-primary h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((totalEarned / 100000) * 100, 100)}%` }}
          />
        </div>
        <p className="text-[10px] text-gray-500 mt-2 font-medium">
          {totalEarned >= 100000 
            ? "You've reached Silver Agent tier!" 
            : `₹${(100000 - totalEarned).toLocaleString()} more to unlock Silver Agent`}
        </p>
      </div>
    </div>
  );
}

