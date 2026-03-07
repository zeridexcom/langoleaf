"use client";

import { Bell, Search, User, Coins, Zap } from "lucide-react";
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
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
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
      window.location.href = `/students?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-dark-surface border-b-2 border-dark-border">
      <div className="flex items-center justify-between h-full px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary flex items-center justify-center border-2 border-white/20 shadow-lg shadow-primary/30">
            <Zap className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight">EduAgent Pro</h1>
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Growth Dashboard</p>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students, applications..."
              className="w-full pl-10 pr-4 py-2 bg-dark-elevated border-2 border-dark-border text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary font-medium"
            />
          </div>
        </form>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Coins Display */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-elevated border-2 border-dark-border">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-amber-400">
              {loading ? "..." : coins.toLocaleString()}
            </span>
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-slate-400 hover:text-white hover:bg-dark-elevated transition-colors border-2 border-transparent hover:border-dark-border">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-primary border border-dark-surface" />
          </button>

          {/* Profile */}
          <button className="flex items-center gap-3 p-1 hover:bg-dark-elevated transition-colors border-2 border-transparent hover:border-dark-border">
            <div className="w-8 h-8 bg-primary/20 flex items-center justify-center border border-primary/30">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-bold text-white">
                {loading ? "..." : user?.full_name || "Agent"}
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase">
                {user?.freelancer_profiles?.[0]?.agent_id || "ID: AGT-001"}
              </p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}

