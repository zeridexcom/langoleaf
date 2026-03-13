"use client";

import { LayoutGrid, List, Grid3X3 } from "lucide-react";

export type ViewMode = "table" | "card" | "grid";

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  className?: string;
}

const views: { mode: ViewMode; icon: React.ElementType; label: string }[] = [
  { mode: "table", icon: List, label: "Table" },
  { mode: "card", icon: LayoutGrid, label: "Cards" },
  { mode: "grid", icon: Grid3X3, label: "Grid" },
];

export function ViewToggle({ currentView, onViewChange, className = "" }: ViewToggleProps) {
  return (
    <div className={`flex items-center bg-gray-100 rounded-lg p-1 ${className}`}>
      {views.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => onViewChange(mode)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            currentView === mode
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
          title={label}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
