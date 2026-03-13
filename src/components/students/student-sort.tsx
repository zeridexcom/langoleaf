"use client";

import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { StudentSort } from "@/hooks/useStudents";

interface StudentSortProps {
  sort: StudentSort;
  onSortChange: (sort: StudentSort) => void;
  className?: string;
}

const sortOptions = [
  { value: "created_at", label: "Date Created" },
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "program", label: "Program" },
  { value: "university", label: "University" },
  { value: "status", label: "Status" },
  { value: "updated_at", label: "Last Updated" },
];

export function StudentSort({ sort, onSortChange, className = "" }: StudentSortProps) {
  const toggleSortOrder = () => {
    onSortChange({
      ...sort,
      sortOrder: sort.sortOrder === "asc" ? "desc" : "asc",
    });
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <select
          value={sort.sortBy}
          onChange={(e) =>
            onSortChange({
              ...sort,
              sortBy: e.target.value,
            })
          }
          className="appearance-none pl-3 pr-10 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              Sort by {option.label}
            </option>
          ))}
        </select>
        <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      <button
        onClick={toggleSortOrder}
        className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        title={sort.sortOrder === "asc" ? "Ascending" : "Descending"}
      >
        {sort.sortOrder === "asc" ? (
          <ArrowUp className="w-4 h-4 text-gray-600" />
        ) : (
          <ArrowDown className="w-4 h-4 text-gray-600" />
        )}
      </button>
    </div>
  );
}
