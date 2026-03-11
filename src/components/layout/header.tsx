"use client";

import { Search, User, Coins, Zap } from "lucide-react";
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
      
      {/* Swiss Style Header - Sharp, Grid-based, High Contrast */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b-2 border-black">
        <div className="flex items-center h-full">
          {/* Logo Section - Left */}
          <div className="flex items-center gap-4 h-full px-6 border-r-2 border-black">
            <div className="w-10 h-10 bg-black flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-lg font-black text-black tracking-tighter uppercase">Lango</h1>
              <p className="text-[10px] font-black text-[#FF3000] uppercase tracking-widest">Partner Portal</p>
            </div>
          </div>

          {/* Search Bar - Center */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center flex-1 max-w-md mx-8 px-4 py-2 bg-[#F2F2F2] border-2 border-black text-left hover:bg-black hover:text-white transition-all duration-150 ease-out group"
          >
            <Search className="w-4 h-4 text-black mr-3 group-hover:text-white" />
            <span className="text-sm font-medium text-black/60 flex-1 group-hover:text-white/80">Search students, applications...</span>
            <div className="flex items-center gap-1 text-xs text-black/40 group-hover:text-white/60">
              <kbd className="px-1.5 py-0.5 bg-white border border-black group-hover:bg-[#FF3000] group-hover:border-[#FF3000] group-hover:text-white">⌘</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-black group-hover:bg-[#FF3000] group-hover:border-[#FF3000] group-hover:text-white">K</kbd>
            </div>
          </button>

          {/* Right Section - Actions */}
          <div className="flex items-center h-full ml-auto">
            {/* Coins Display */}
            <div className="flex items-center gap-2 px-4 h-full border-l-2 border-black bg-[#F2F2F2]">
              <Coins className="w-4 h-4 text-black" />
              <span className="text-sm font-black uppercase tracking-wide">
                {loading ? "..." : coins.toLocaleString()}
              </span>
            </div>

            {/* Notifications */}
            <div className="h-full border-l-2 border-black">
              <NotificationDropdown />
            </div>

            {/* Profile */}
            <button className="flex items-center gap-3 px-4 h-full border-l-2 border-black hover:bg-black hover:text-white transition-all duration-150 ease-out group">
              <div className="w-8 h-8 bg-black flex items-center justify-center group-hover:bg-[#FF3000]">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-black uppercase tracking-wide">
                  {loading ? "..." : user?.full_name || "Agent"}
                </p>
                <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest group-hover:text-white/60">
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
