"use client";

import { FileText, ChevronRight } from "lucide-react";

const recentApplications = [
  {
    id: "APP-2024-001",
    studentName: "Rahul Sharma",
    program: "MBA",
    university: "IIM Bangalore",
    status: "under_review",
    date: "2 hours ago",
    commission: "₹15,000",
  },
  {
    id: "APP-2024-002",
    studentName: "Priya Patel",
    program: "B.Tech",
    university: "IIT Delhi",
    status: "documents_pending",
    date: "5 hours ago",
    commission: "₹12,000",
  },
  {
    id: "APP-2024-003",
    studentName: "Amit Kumar",
    program: "MCA",
    university: "NIT Trichy",
    status: "approved",
    date: "1 day ago",
    commission: "₹10,000",
  },
];

const statusStyles: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
  submitted: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  documents_pending: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  under_review: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  approved: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  rejected: "bg-red-500/20 text-red-400 border border-red-500/30",
  payment_pending: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  payment_received: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
  enrolled: "bg-[#6d28d9]/20 text-[#a78bfa] border border-[#6d28d9]/30",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  documents_pending: "Docs Pending",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  payment_pending: "Payment Pending",
  payment_received: "Payment Received",
  enrolled: "Enrolled",
};

export function RecentApplications() {
  return (
    <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Recent Applications</h3>
        <a
          href="/applications"
          className="text-sm text-[#6d28d9] hover:text-[#a78bfa] flex items-center gap-1 transition-colors"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>

      <div className="space-y-4">
        {recentApplications.map((app) => (
          <div
            key={app.id}
            className="flex items-center gap-4 p-4 bg-[#252542] rounded-xl hover:bg-[#2d2d4a] transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-[#22d3ee]/20 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-[#22d3ee]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-white">
                  {app.studentName}
                </h4>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-500">{app.id}</span>
              </div>
              <p className="text-xs text-gray-400 truncate">
                {app.program} • {app.university}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[app.status]}`}
              >
                {statusLabels[app.status]}
              </span>
              <p className="text-xs text-[#fbbf24] mt-1 font-medium">{app.commission}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
