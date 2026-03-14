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
            .select("*")
            .eq("id", authUser.id)
            .single();
          
          if (profile) {
            setUser(profile);
            setCoins(profile.coins_balance || 0);
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
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          {/* Logo */}
          <div className="flex items-center gap-2 lg:gap-3 shrink-0">
            <div className="w-9 h-9 lg:w-10 lg:h-10 bg-primary flex items-center justify-center rounded-xl shadow-md">
              <Zap className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <div className="hidden xs:block">
              <h1 className="text-base lg:text-lg font-black text-gray-900 tracking-tight">Lango</h1>
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Partner Portal</p>
            </div>
          </div>

          {/* Search Bar - Click to open global search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center flex-1 max-w-sm lg:max-w-md mx-4 lg:mx-8 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-left hover:bg-gray-100 transition-colors group"
          >
            <Search className="w-4 h-4 text-gray-400 mr-3 shrink-0" />
            <span className="text-sm text-gray-400 flex-1 truncate">Search students...</span>
            <div className="hidden lg:flex items-center gap-1 text-xs text-gray-400">
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded">⌘</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded">K</kbd>
            </div>
          </button>

          {/* Right Section */}
          <div className="flex items-center gap-2 lg:gap-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Coins Display */}
            <div className="hidden xs:flex items-center gap-2 px-2 lg:px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
              <Coins className="w-4 h-4 text-amber-500" />
              <span className="text-xs lg:text-sm font-bold text-amber-500">
                {loading ? "..." : coins.toLocaleString()}
              </span>
            </div>

            {/* Notifications Dropdown */}
            <NotificationDropdown />

            {/* Profile */}
            <button className="flex items-center gap-2 lg:gap-3 p-1 hover:bg-gray-100 transition-colors rounded-lg border border-transparent hover:border-gray-200">
              <div className="w-8 h-8 lg:w-9 lg:h-9 bg-primary/10 flex items-center justify-center rounded-lg border border-primary/20">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-bold text-gray-900 truncate max-w-[100px]">
                  {loading ? "..." : user?.full_name || "Agent"}
                </p>
                <p className="text-[10px] font-bold text-gray-500 uppercase">
                  {user?.agent_code || "AGT-001"}
                </p>
              </div>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
