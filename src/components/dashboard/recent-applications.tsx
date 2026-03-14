"use client";

import { FileText, ChevronRight } from "lucide-react";
import { SectionPanel } from "@/components/ui/design-system";
import { cn } from "@/lib/utils/cn";

interface Application {
  id: string;
  program: string;
  university: string;
  status: string;
  commission_amount?: number;
  created_at: string;
  student?: {
    name: string;
  };
}

interface RecentApplicationsProps {
  applications?: Application[];
}

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 border border-gray-300",
  submitted: "bg-blue-50 text-blue-600 border border-blue-200",
  documents_pending: "bg-amber-50 text-amber-600 border border-amber-200",
  under_review: "bg-primary/10 text-primary border border-primary/30",
  approved: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  rejected: "bg-red-50 text-red-600 border border-red-200",
  payment_pending: "bg-orange-50 text-orange-600 border border-orange-200",
  payment_received: "bg-cyan-50 text-cyan-600 border border-cyan-200",
  enrolled: "bg-primary/10 text-primary border border-primary/30",
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

export function RecentApplications({ applications = [] }: RecentApplicationsProps) {
  const displayApplications = applications.slice(0, 5);

  return (
    <SectionPanel 
      title="Recent Applications"
      action={
        <a
          href="/applications"
          className="text-[10px] font-black text-primary hover:text-primary/80 flex items-center gap-1 transition-colors uppercase tracking-[0.2em]"
        >
          View All
          <ChevronRight className="w-3 h-3" />
        </a>
      }
    >

      {displayApplications.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
          <p className="font-medium">No applications yet</p>
          <a href="/applications/create" className="text-primary hover:text-primary/80 text-xs font-black mt-3 inline-block uppercase tracking-wider border border-primary px-4 py-2 hover:bg-primary/10 transition-colors rounded-lg">
            Create your first application
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {displayApplications.map((app) => (
            <div
              key={app.id}
              className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 hover:border-primary/30 transition-all rounded-lg"
            >
              <div className="w-10 h-10 bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-gray-900 truncate">
                    {app.student?.name || "Student"}
                  </h4>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">• {app.id.slice(0, 8)}</span>
                </div>
                <p className="text-xs text-gray-500 truncate font-medium">
                  {app.program} • {app.university}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md ${statusStyles[app.status] || statusStyles.draft}`}
                >
                  {statusLabels[app.status] || "Draft"}
                </span>
                {app.commission_amount && (
                  <p className="text-[10px] text-primary mt-1 font-black">₹{app.commission_amount.toLocaleString()}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionPanel>
  );
}
