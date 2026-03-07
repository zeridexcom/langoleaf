"use client";

import { Plus, FileText, Users, Upload } from "lucide-react";

const actions = [
  {
    title: "Add New Student",
    description: "Register a new student for admission",
    icon: Plus,
    href: "/students/add",
    color: "bg-primary",
    borderColor: "border-primary",
  },
  {
    title: "New Application",
    description: "Submit application for a student",
    icon: FileText,
    href: "/applications/create",
    color: "bg-blue-500",
    borderColor: "border-blue-500",
  },
  {
    title: "View All Students",
    description: "Manage your student list",
    icon: Users,
    href: "/students",
    color: "bg-emerald-500",
    borderColor: "border-emerald-500",
  },
  {
    title: "Upload Documents",
    description: "Submit required documents",
    icon: Upload,
    href: "/documents",
    color: "bg-amber-500",
    borderColor: "border-amber-500",
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action) => (
        <a
          key={action.title}
          href={action.href}
          className="group flex items-center gap-4 p-4 bg-dark-surface border-2 border-dark-border hover:border-primary/50 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[2px_2px_0px_0px_rgba(236,91,19,0.3)] hover:translate-x-0.5 hover:translate-y-0.5"
        >
          <div className={`${action.color} p-2.5 border-2 ${action.borderColor} text-white`}>
            <action.icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white group-hover:text-primary transition-colors uppercase tracking-wide">
              {action.title}
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
              {action.description}
            </p>
          </div>
        </a>
      ))}
    </div>
  );
}

