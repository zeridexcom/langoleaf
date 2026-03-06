"use client";

import { Bell, Search, User, Coins } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function Header() {
  const [user, setUser] = useState<any>(null);
  const [coins, setCoins] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      try {
        const supabase = createClient();
        // Get current user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          // Get profile data
          const { data: profile } = await supabase
            .from("profiles")
            .select("*, freelancer_profiles(*)")
            .eq("id", authUser.id)
            .single();
          
          if (profile) {
            setUser(profile);
            setCoins(profile.freelancer_profiles?.[0]?.coins_balance || 0);
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirect to students page with search query
      window.location.href = `/students?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#1a1a2e]/80 backdrop-blur-xl border-b border-[#2d2d4a]">
      <div className="flex items-center justify-between h-full px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6d28d9] to-[#22d3ee] flex items-center justify-center">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">LangoLeaf</h1>
            <p className="text-xs text-gray-400">Freelancer Hub</p>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students, applications..."
              className="w-full pl-10 pr-4 py-2 bg-[#252542] border border-[#2d2d4a] rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/50"
            />
          </div>
        </form>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Coins Display */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252542] rounded-xl border border-[#2d2d4a]">
            <Coins className="w-4 h-4 text-[#fbbf24]" />
            <span className="text-sm font-semibold text-[#fbbf24]">
              {loading ? "..." : coins.toLocaleString()}
            </span>
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
          </button>

          {/* Profile */}
          <button className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-[#252542] transition-colors">
            <div className="w-8 h-8 rounded-lg bg-[#6d28d9]/20 flex items-center justify-center">
              <User className="w-4 h-4 text-[#6d28d9]" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-white">
                {loading ? "Loading..." : user?.full_name || "User"}
              </p>
              <p className="text-xs text-gray-400">
                {user?.freelancer_profiles?.[0]?.agent_id || "Agent"}
              </p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}

