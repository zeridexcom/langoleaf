"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, FileText, Loader2 } from "lucide-react";
import { 
  useApplications, 
  usePaginatedApplications,
  useCreateApplication,
  useUpdateApplicationStatus,
  useDeleteApplication,
} from "@/hooks/useApplications";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge, StatusProgress } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner, SkeletonTable } from "@/components/ui/loading-spinner";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ApplicationWithRelations, ApplicationFilters, ApplicationSort } from "@/types/api";

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "documents_pending", label: "Documents Pending" },
  { value: "interview_scheduled", label: "Interview Scheduled" },
  { value: "offer_received", label: "Offer Received" },
  { value: "offer_accepted", label: "Offer Accepted" },
  { value: "visa_applied", label: "Visa Applied" },
  { value: "enrolled", label: "Enrolled" },
];

function ApplicationsContent() {
  const searchParams = useSearchParams();
  
  // State
  const [filters, setFilters] = useState<ApplicationFilters>({
    search: searchParams.get("search") || "",
  });
  const [sort, setSort] = useState<ApplicationSort>({
    sortBy: "created_at",
    sortOrder: "desc",
  });
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithRelations | null>(null);
  const [newStatus, setNewStatus] = useState("");

  // Queries and Mutations
  const { data, isLoading } = usePaginatedApplications(page, 20, filters, sort);
  const createApplication = useCreateApplication();
  const updateStatus = useUpdateApplicationStatus();
  const deleteApplication = useDeleteApplication();

  const applications = data?.applications || [];
  const pagination = data?.pagination;

  // Columns for DataTable
  const columns = [
    {
      key: "student",
      header: "Student",
      sortable: true,
      render: (app: ApplicationWithRelations) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-medium">
              {(app.student as any)?.full_name?.charAt(0) || "?"}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{(app.student as any)?.full_name}</p>
            <p className="text-xs text-gray-500">{app.student?.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "university",
      header: "University & Program",
      render: (app: ApplicationWithRelations) => (
        <div>
          <p className="text-sm text-gray-900">{app.university?.name || "-"}</p>
          <p className="text-xs text-gray-500">{app.program?.name || "-"}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (app: ApplicationWithRelations) => (
        <div className="space-y-1">
          <StatusBadge status={app.status} size="sm" />
          <StatusProgress currentStatus={app.status} />
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Submitted",
      sortable: true,
      render: (app: ApplicationWithRelations) => (
        <span className="text-sm text-gray-500">
          {new Date(app.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (app: ApplicationWithRelations) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedApplication(app);
              setNewStatus(app.status);
              setShowStatusDialog(true);
            }}
          >
            Update Status
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm("Are you sure you want to delete this application?")) {
                deleteApplication.mutate(app.id);
              }
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  // Handlers
  const handleSort = (column: string) => {
    setSort((prev) => ({
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  const handleStatusUpdate = () => {
    if (selectedApplication && newStatus) {
      updateStatus.mutate(
        { id: selectedApplication.id, status: newStatus },
        {
          onSuccess: () => {
            setShowStatusDialog(false);
            setSelectedApplication(null);
          },
        }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonTable rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Applications"
        description="Manage student applications and track their progress"
        icon={FileText}
        breadcrumbs={[{ label: "Applications" }]}
        actions={
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Application
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput
          value={filters.search || ""}
          onChange={(value) => setFilters({ ...filters, search: value })}
          placeholder="Search applications..."
          className="flex-1 max-w-md"
        />
        <Select
          value={filters.status?.[0] || "all"}
          onValueChange={(value) => 
            setFilters({ ...filters, status: value === "all" ? undefined : [value] })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Applications Table */}
      {applications.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No applications yet"
          description="Start by creating a new application for your students"
          action={{
            label: "Create Application",
            onClick: () => setShowCreateDialog(true),
          }}
        />
      ) : (
        <DataTable
          data={applications}
          columns={columns}
          keyExtractor={(app) => app.id}
          selectedIds={selectedIds}
          onSelect={(id, selected) => {
            setSelectedIds((prev) =>
              selected ? [...prev, id] : prev.filter((i) => i !== id)
            );
          }}
          onSelectAll={(selected) => {
            setSelectedIds(selected ? applications.map((a) => a.id) : []);
          }}
          sort={{
            sortBy: sort.sortBy,
            sortOrder: sort.sortOrder,
            onSort: handleSort,
          }}
          pagination={
            pagination
              ? {
                  page: pagination.page,
                  totalPages: pagination.totalPages,
                  total: pagination.total,
                  onPageChange: setPage,
                }
              : undefined
          }
        />
      )}

      {/* Create Application Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-500">
              Select a student and university to create a new application.
            </p>
            {/* Add form fields here */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowCreateDialog(false)}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Application Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-500">
              Current status: <StatusBadge status={selectedApplication?.status || ""} />
            </p>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate}>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <ApplicationsContent />
    </Suspense>
  );
}
