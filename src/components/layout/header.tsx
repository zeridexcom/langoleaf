"use client";

import { Search, User, Coins, Zap } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { GlobalSearch } from "@/components/search/global-search";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function Header() {
  const [user, setUser] = useState<any>(null);
  const [coins, setCoins] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
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
            .eq("user_id", authUser.id)
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

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between h-full px-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-xl shadow-md">
              <Zap className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900 tracking-tight">Lango</h1>
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Partner Portal</p>
            </div>
          </div>

          {/* Search Bar - Click to open global search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center flex-1 max-w-md mx-8 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-left hover:bg-gray-100 transition-colors group"
          >
            <Search className="w-4 h-4 text-gray-400 mr-3" />
            <span className="text-sm text-gray-400 flex-1">Search students, applications...</span>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded">⌘</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded">K</kbd>
            </div>
          </button>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Coins Display */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
              <Coins className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold text-amber-500">
                {loading ? "..." : coins.toLocaleString()}
              </span>
            </div>

            {/* Notifications Dropdown */}
            <NotificationDropdown />

            {/* Profile */}
            <button className="flex items-center gap-3 p-1 hover:bg-gray-100 transition-colors rounded-lg border border-transparent hover:border-gray-200">
              <div className="w-8 h-8 bg-primary/10 flex items-center justify-center rounded-lg border border-primary/20">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-bold text-gray-900">
                  {loading ? "..." : user?.full_name || "Agent"}
                </p>
                <p className="text-[10px] font-bold text-gray-500 uppercase">
                  {user?.freelancer_profiles?.[0]?.agent_id || "ID: AGT-001"}
                </p>
              </div>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
