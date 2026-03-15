"use client";

import { useState } from "react";
import { 
  useApplications, 
  useUpdateApplicationStatus 
} from "@/hooks/useApplications";
import { 
  CheckCircle, 
  XCircle, 
  Search,
  Loader2,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "react-hot-toast";
import type { ApplicationWithRelations } from "@/types/api";

export function ApplicationManagement() {
  const { data: applications, isLoading } = useApplications();
  const updateStatus = useUpdateApplicationStatus();
  
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState<ApplicationWithRelations | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");

  const filteredApps = applications?.filter(app => {
    const searchLower = search.toLowerCase();
    const studentName = app.student?.name || "";
    const freelancerName = (app.student as any)?.freelancer?.full_name || (app.student as any)?.freelancer?.email || "";
    
    return (
      app.university?.name?.toLowerCase().includes(searchLower) ||
      app.program?.name?.toLowerCase().includes(searchLower) ||
      studentName.toLowerCase().includes(searchLower) ||
      freelancerName.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleAction = async () => {
    if (!selectedApp || !actionType) return;
    
    if (actionType === "reject" && !reason) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    const newStatus = actionType === "approve" ? "approved" : "rejected";
    
    try {
      await updateStatus.mutateAsync({ 
        id: selectedApp.id, 
        status: newStatus, 
        reason: actionType === "reject" ? reason : undefined 
      });
      toast.success(`Application ${newStatus} successfully`);
      setShowActionDialog(false);
      setSelectedApp(null);
      setReason("");
    } catch (error) {
      console.error("Error updating application:", error);
      toast.error("Failed to update application");
    }
  };

  const columns = [
    {
      key: "student",
      header: "Student",
      render: (app: ApplicationWithRelations) => (
        <div>
          <p className="font-bold text-gray-900">{app.student?.name}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-tight">by {(app.student as any)?.freelancer?.full_name || "Agent"}</p>
        </div>
      ),
    },
    {
      key: "program",
      header: "Program & University",
      render: (app: ApplicationWithRelations) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{app.program?.name}</p>
          <p className="text-xs text-gray-500">{app.university?.name}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (app: ApplicationWithRelations) => (
        <StatusBadge status={app.status || "submitted"} size="sm" />
      ),
    },
    {
      key: "date",
      header: "Submitted",
      render: (app: ApplicationWithRelations) => (
        <span className="text-xs text-gray-500">
          {new Date(app.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (app: ApplicationWithRelations) => (
        <div className="flex gap-2">
          {app.status === "submitted" || app.status === "under_review" || app.status === "draft" || !app.status ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => {
                  setSelectedApp(app);
                  setActionType("approve");
                  setShowActionDialog(true);
                }}
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 border-rose-200 text-rose-700 hover:bg-rose-50"
                onClick={() => {
                  setSelectedApp(app);
                  setActionType("reject");
                  setShowActionDialog(true);
                }}
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                Reject
              </Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" className="h-8 text-gray-400" disabled>
              Processed
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search applications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <DataTable
          data={filteredApps}
          columns={columns}
          keyExtractor={(app) => app.id}
        />
        
        {filteredApps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">No applications found</h3>
            <p className="text-xs text-gray-500 mt-1">There are no applications matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">
              {actionType === "approve" ? "Approve Application" : "Reject Application"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {selectedApp && (
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Application Details</p>
                <p className="text-sm font-bold text-gray-900">{selectedApp.student?.name}</p>
                <p className="text-xs text-gray-600 font-medium">{selectedApp.program?.name} at {selectedApp.university?.name}</p>
              </div>
            )}

            {actionType === "approve" ? (
              <p className="text-sm text-gray-600 font-medium">
                Approving this application will notify the freelancer and trigger commission tracking. This action cannot be easily undone.
              </p>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-700 uppercase tracking-widest">Rejection Reason</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Incomplete documentation, missing transcripts..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-none font-medium"
                />
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-3 sm:gap-0">
            <Button variant="outline" onClick={() => setShowActionDialog(false)} className="rounded-xl font-bold uppercase tracking-wider text-xs">
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={updateStatus.isPending}
              className={actionType === "approve" ? "bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs px-6" : "bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs px-6"}
            >
              {updateStatus.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (actionType === "approve" ? "Confirm Approval" : "Confirm Rejection")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
