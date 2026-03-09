"use client";

import { useState } from "react";
import { Search, Filter, FileCheck, Clock, CheckCircle, XCircle, MoreVertical } from "lucide-react";

const applications = [
  {
    id: 1,
    studentName: "Rahul Sharma",
    program: "MBA",
    university: "IIM Bangalore",
    status: "under_review",
    submittedDate: "2024-01-15",
    commission: "₹25,000",
  },
  {
    id: 2,
    studentName: "Priya Patel",
    program: "B.Tech",
    university: "IIT Delhi",
    status: "documents_pending",
    submittedDate: "2024-01-14",
    commission: "₹15,000",
  },
  {
    id: 3,
    studentName: "Amit Kumar",
    program: "MCA",
    university: "NIT Trichy",
    status: "approved",
    submittedDate: "2024-01-10",
    commission: "₹20,000",
  },
  {
    id: 4,
    studentName: "Sneha Gupta",
    program: "BBA",
    university: "Christ University",
    status: "enrolled",
    submittedDate: "2024-01-08",
    commission: "₹18,000",
  },
];

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  under_review: { icon: Clock, color: "text-primary", bg: "bg-primary/10", label: "Under Review" },
  documents_pending: { icon: FileCheck, color: "text-amber-400", bg: "bg-amber-500/10", label: "Docs Pending" },
  approved: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Approved" },
  enrolled: { icon: CheckCircle, color: "text-[#ec5b13]", bg: "bg-[#ec5b13]/10", label: "Enrolled" },
  rejected: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", label: "Rejected" },
};

export default function ApplicationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredApplications = applications.filter((app) => {
    const matchesSearch = app.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.university.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Applications</h1>
          <p className="text-gray-400 mt-1">Track and manage student applications</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-surface border border-dark-border rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-dark-surface border border-dark-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/50"
        >
          <option value="all">All Status</option>
          <option value="under_review">Under Review</option>
          <option value="documents_pending">Docs Pending</option>
          <option value="approved">Approved</option>
          <option value="enrolled">Enrolled</option>
        </select>
      </div>

      {/* Applications List */}
      <div className="bg-dark-surface border border-dark-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Student</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Program</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">University</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Commission</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((app) => {
                const status = statusConfig[app.status];
                return (
                  <tr key={app.id} className="border-b border-dark-border last:border-0 hover:bg-[#252542]/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-white">{app.studentName}</p>
                        <p className="text-xs text-gray-400">Submitted {app.submittedDate}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-white">{app.program}</td>
                    <td className="px-6 py-4 text-sm text-white">{app.university}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                        <status.icon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-emerald-400">{app.commission}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-[#252542] rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
