"use client";

import { Bell, Search, User, Coins } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/80 dark:bg-[#1a1a2e]/80 backdrop-blur-xl border-b border-gray-200 dark:border-[#2d2d4a] transition-colors duration-300">
      <div className="flex items-center justify-between h-full px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6d28d9] to-[#22d3ee] flex items-center justify-center">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">LangoLeaf</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Freelancer Hub</p>
          </div>
        </div>

        {/* Search */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search students, applications..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-[#252542] border border-gray-200 dark:border-[#2d2d4a] rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/50"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Coins Display */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-[#252542] rounded-xl border border-gray-200 dark:border-[#2d2d4a]">
            <Coins className="w-4 h-4 text-[#fbbf24]" />
            <span className="text-sm font-semibold text-[#fbbf24]">2,450</span>
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
          </button>

          {/* Profile */}
          <button className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#252542] transition-colors">
            <div className="w-8 h-8 rounded-lg bg-[#6d28d9]/20 flex items-center justify-center">
              <User className="w-4 h-4 text-[#6d28d9]" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white">John Doe</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Agent #1234</p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
