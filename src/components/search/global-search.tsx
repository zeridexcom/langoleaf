"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X, Command, FileText, Users, HelpCircle, MessageSquare, Home, LayoutDashboard, TrendingUp, FolderOpen, Bell, UserCircle, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: "student" | "application" | "page" | "support";
  href: string;
  icon: any;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const staticPages: SearchResult[] = [
  { id: "dashboard", title: "Dashboard", type: "page", href: "/dashboard", icon: LayoutDashboard },
  { id: "students", title: "Students", type: "page", href: "/students", icon: Users },
  { id: "applications", title: "Applications", type: "page", href: "/applications", icon: FileText },
  { id: "earnings", title: "Earnings", type: "page", href: "/earnings", icon: TrendingUp },
  { id: "documents", title: "Documents", type: "page", href: "/documents", icon: FolderOpen },
  { id: "notifications", title: "Notifications", type: "page", href: "/notifications", icon: Bell },
  { id: "profile", title: "Profile", type: "page", href: "/profile", icon: UserCircle },
  { id: "support", title: "Support", type: "support", href: "/support", icon: HelpCircle },
  { id: "admin", title: "Admin", type: "page", href: "/admin", icon: Shield },
];

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [students, setStudents] = useState<SearchResult[]>([]);
  const [applications, setApplications] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Load students and applications from database
  useEffect(() => {
    if (!isOpen) return;
    
    async function loadData() {
      const supabase = createClient();
      
      // Load students
      const { data: studentsData } = await supabase
        .from("students")
        .select("id, name, email, program, university")
        .limit(50);
      
      if (studentsData) {
        setStudents(studentsData.map(s => ({
          id: s.id,
          title: s.name,
          subtitle: `${s.program} • ${s.university}`,
          type: "student" as const,
          href: `/students?id=${s.id}`,
          icon: Users,
        })));
      }
      
      // Load applications
      const { data: appsData } = await supabase
        .from("applications")
        .select("id, program, university, status, student:students(name)")
        .limit(50);
      
      if (appsData) {
        setApplications(appsData.map(a => ({
          id: a.id,
          title: a.program,
          subtitle: `${a.university} • ${a.student?.name || "Unknown"}`,
          type: "application" as const,
          href: `/applications?id=${a.id}`,
          icon: FileText,
        })));
      }
    }
    
    loadData();
  }, [isOpen]);

  // Filter results based on query
  useEffect(() => {
    if (!query.trim()) {
      setResults([...staticPages.slice(0, 6)]);
      return;
    }
    
    const lowerQuery = query.toLowerCase();
    const filtered: SearchResult[] = [];
    
    // Filter students
    const filteredStudents = students.filter(s => 
      s.title.toLowerCase().includes(lowerQuery) ||
      s.subtitle?.toLowerCase().includes(lowerQuery)
    );
    filtered.push(...filteredStudents.slice(0, 5));
    
    // Filter applications
    const filteredApps = applications.filter(a => 
      a.title.toLowerCase().includes(lowerQuery) ||
      a.subtitle?.toLowerCase().includes(lowerQuery)
    );
    filtered.push(...filteredApps.slice(0, 5));
    
    // Filter pages
    const filteredPages = staticPages.filter(p => 
      p.title.toLowerCase().includes(lowerQuery)
    );
    filtered.push(...filteredPages);
    
    setResults(filtered.slice(0, 10));
    setSelectedIndex(0);
  }, [query, students, applications]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % results.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + results.length) % results.length);
      } else if (e.key === "Enter" && results[selectedIndex]) {
        window.location.href = results[selectedIndex].href;
        onClose();
      }
    }
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Search Modal */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students, applications, pages..."
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none text-base"
            autoFocus
          />
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">ESC</kbd>
            <span>to close</span>
          </div>
        </div>
        
        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No results found</p>
            </div>
          ) : (
            <div className="py-2">
              {results.map((result, index) => (
                <a
                  key={`${result.type}-${result.id}`}
                  href={result.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-colors ${
                    index === selectedIndex 
                      ? "bg-primary/10 border border-primary/30" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    result.type === "student" ? "bg-blue-50 text-blue-600" :
                    result.type === "application" ? "bg-emerald-50 text-emerald-600" :
                    result.type === "support" ? "bg-amber-50 text-amber-600" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    <result.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {result.title}
                    </p>
                    {result.subtitle && (
                      <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 capitalize">{result.type}</span>
                </a>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border">↑↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border">↵</kbd>
              to select
            </span>
          </div>
          <span>{results.length} results</span>
        </div>
      </div>
    </div>
  );
}
