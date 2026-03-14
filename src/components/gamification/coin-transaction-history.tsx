"use client";

import { useState } from "react";
import { useTransactionHistory } from "@/hooks/useGamification";
import { cn } from "@/lib/utils/cn";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface CoinTransactionHistoryProps {
  limit?: number;
  showFilters?: boolean;
  className?: string;
}

const transactionTypeConfig = {
  earned: {
    icon: ArrowDownLeft,
    color: "text-green-500",
    bg: "bg-green-500/20",
    label: "Earned",
  },
  spent: {
    icon: ArrowUpRight,
    color: "text-red-500",
    bg: "bg-red-500/20",
    label: "Spent",
  },
  bonus: {
    icon: Gift,
    color: "text-purple-500",
    bg: "bg-purple-500/20",
    label: "Bonus",
  },
  refund: {
    icon: RotateCcw,
    color: "text-blue-500",
    bg: "bg-blue-500/20",
    label: "Refund",
  },
};

export function CoinTransactionHistory({
  limit = 20,
  showFilters = true,
  className,
}: CoinTransactionHistoryProps) {
  const [type, setType] = useState<"earned" | "spent" | "bonus" | "refund" | undefined>(undefined);
  const [offset, setOffset] = useState(0);

  const { data, isLoading } = useTransactionHistory({
    type,
    limit,
    offset,
  });

  const transactions = data?.transactions || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          <Button
            variant={type === undefined ? "default" : "ghost"}
            size="sm"
            onClick={() => setType(undefined)}
            className="text-xs"
          >
            All
          </Button>
          {Object.entries(transactionTypeConfig).map(([key, config]) => (
            <Button
              key={key}
              variant={type === key ? "default" : "ghost"}
              size="sm"
              onClick={() => setType(key as typeof type)}
              className={cn("text-xs", type === key && config.color)}
            >
              {config.label}
            </Button>
          ))}
        </div>
      )}

      {/* Transactions List */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 bg-dark-elevated rounded-xl animate-pulse"
            />
          ))
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No transactions found
          </div>
        ) : (
          transactions.map((tx) => {
            const config = transactionTypeConfig[tx.type];
            const Icon = config.icon;
            const isPositive = tx.type === "earned" || tx.type === "bonus" || tx.type === "refund";

            return (
              <div
                key={tx.id}
                className="p-4 bg-dark-elevated rounded-xl border border-dark-border hover:border-dark-border/80 transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", config.bg)}>
                    <Icon className={cn("w-5 h-5", config.color)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{tx.reason}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(tx.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <p className={cn("font-bold text-lg", isPositive ? "text-green-500" : "text-red-500")}>
                      {isPositive ? "+" : ""}{tx.amount}
                    </p>
                    <p className="text-xs text-gray-500">
                      Balance: {tx.balanceAfter}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-400">
            Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOffset(offset + limit)}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
