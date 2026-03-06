"use client";

import { Plus, FileText, Users, Upload } from "lucide-react";

const actions = [
  {
    title: "Add New Student",
    description: "Register a new student for admission",
    icon: Plus,
    href: "/students/add",
    color: "bg-[#6d28d9]",
  },
  {
    title: "New Application",
    description: "Submit application for a student",
    icon: FileText,
    href: "/applications/create",
    color: "bg-[#22d3ee]",
  },
  {
    title: "View All Students",
    description: "Manage your student list",
    icon: Users,
    href: "/students",
    color: "bg-emerald-500",
  },
  {
    title: "Upload Documents",
    description: "Submit required documents",
    icon: Upload,
    href: "/documents",
    color: "bg-amber-500",
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action) => (
        <a
          key={action.title}
          href={action.href}
          className="group flex items-center gap-4 p-4 bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-[#2d2d4a] rounded-2xl hover:border-[#6d28d9]/50 transition-all duration-300 shadow-sm"
        >
          <div className={`${action.color} p-3 rounded-xl text-white`}>
            <action.icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-[#6d28d9] transition-colors">
              {action.title}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {action.description}
            </p>
          </div>
        </a>
      ))}
    </div>
  );
}
