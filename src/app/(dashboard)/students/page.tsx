"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { Search, Plus, Loader2, Download } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useInView } from "react-intersection-observer";
import { 
  useInfiniteStudents, 
  StudentFilters, 
  StudentSort as StudentSortType, 
  Student,
  useBulkDeleteStudents,
  useBulkUpdateStatus,
} from "@/hooks/useStudents";
import { StudentFiltersPanel } from "@/components/students/student-filters";
import { StudentSort } from "@/components/students/student-sort";
import { ViewToggle, ViewMode } from "@/components/students/view-toggle";
import { StudentCard } from "@/components/students/student-card";
import { StudentGrid } from "@/components/students/student-grid";
import { StudentActions } from "@/components/students/student-actions";
import { BulkActions } from "@/components/students/bulk-actions";
import { ExportDialog } from "@/components/students/export-dialog";
import { exportStudents } from "@/lib/utils/export";

const statusStyles: Record<string, string> = {
  lead: "bg-gray-100 text-gray-700 border border-gray-200",
  application_submitted: "bg-blue-100 text-blue-700 border border-blue-200",
  documents_pending: "bg-amber-100 text-amber-700 border border-amber-200",
  under_review: "bg-primary/10 text-primary border border-primary/20",
  approved: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  enrolled: "bg-purple-100 text-purple-700 border border-purple-200",
  rejected: "bg-red-100 text-red-700 border border-red-200",
};

const statusLabels: Record<string, string> = {
  lead: "Lead",
  application_submitted: "Submitted",
  documents_pending: "Docs Pending",
  under_review: "Under Review",
  approved: "Approved",
  enrolled: "Enrolled",
  rejected: "Rejected",
};

function StudentsContent() {
  const searchParams = useSearchParams();
  
  // State
  const [filters, setFilters] = useState<StudentFilters>({
    search: searchParams.get("search") || "",
  });
  const [sort, setSort] = useState<StudentSortType>({
    sortBy: "created_at",
    sortOrder: "desc",
  });
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    programs: [] as string[],
    universities: [] as string[],
    sources: [] as string[],
    tags: [] as string[],
  });

  // Infinite query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteStudents(filters, sort, 20);

  // Intersection observer for infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  // Fetch next page when in view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Update filter options when data changes
  useEffect(() => {
    if (data?.pages[0]?.filters) {
      setFilterOptions(data.pages[0].filters);
    }
  }, [data]);

  // Bulk operations
  const bulkDelete = useBulkDeleteStudents();
  const bulkUpdateStatus = useBulkUpdateStatus();

  // Flatten all students from all pages
  const allStudents = data?.pages.flatMap((page) => page.students) || [];
  const totalCount = data?.pages[0]?.pagination.total || 0;

  // Selection handlers
  const toggleSelection = useCallback((id: string, selected: boolean) => {
    setSelectedIds((prev) =>
      selected ? [...prev, id] : prev.filter((sid) => sid !== id)
    );
  }, []);

  const toggleAllSelection = useCallback(() => {
    if (selectedIds.length === allStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allStudents.map((s) => s.id));
    }
  }, [selectedIds.length, allStudents]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // Bulk action handlers
  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.length} students?`)) {
      bulkDelete.mutate(selectedIds, {
        onSuccess: () => {
          setSelectedIds([]);
          refetch();
        },
      });
    }
  };

  const handleBulkStatusChange = (status: string) => {
    bulkUpdateStatus.mutate(
      { ids: selectedIds, status },
      {
        onSuccess: () => {
          setSelectedIds([]);
          refetch();
        },
      }
    );
  };

  // Export handler
  const handleExport = () => {
    if (selectedIds.length > 0) {
      setShowExportDialog(true);
    } else {
      // Export all visible students
      exportStudents(allStudents, {
        format: "xlsx",
        filename: `all_students_${new Date().toISOString().split("T")[0]}`,
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500">
            {totalCount > 0 ? `${totalCount} students total` : "Manage your students and their applications"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <a
            href="/students/add"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Student
          </a>
        </div>
      </div>

      {/* Bulk Actions */}
      <BulkActions
        selectedIds={selectedIds}
        students={allStudents}
        onClearSelection={clearSelection}
        onDelete={handleBulkDelete}
        onStatusChange={handleBulkStatusChange}
      />

      {/* Filters */}
      <StudentFiltersPanel
        filters={filters}
        onFiltersChange={setFilters}
        filterOptions={filterOptions}
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={filters.search || ""}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Sort & View Toggle */}
        <div className="flex items-center gap-3">
          <StudentSort sort={sort} onSortChange={setSort} />
          <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
        </div>
      </div>

      {/* Students Content */}
      {allStudents.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your filters or add a new student</p>
          <a
            href="/students/add"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Student
          </a>
        </div>
      ) : (
        <>
          {/* Table View */}
          {viewMode === "table" && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/50">
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedIds.length === allStudents.length && allStudents.length > 0}
                            onChange={toggleAllSelection}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          Student
                        </label>
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Program</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">University</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Date</th>
                      <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allStudents.map((student) => (
                      <tr
                        key={student.id}
                        className="border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(student.id)}
                              onChange={(e) => toggleSelection(student.id, e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <a 
                              href={`/students/${student.id}`}
                              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                            >
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <span className="text-primary font-medium">
                                  {student.name?.charAt(0) || "?"}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{student.name}</p>
                                <p className="text-xs text-gray-500">{student.email}</p>
                              </div>
                            </a>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{student.program || "-"}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{student.university || "-"}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[student.status] || statusStyles.lead}`}
                          >
                            {statusLabels[student.status] || "Lead"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(student.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <StudentActions 
                            studentId={student.id} 
                            studentName={student.name}
                            onDelete={() => refetch()}
                            isSelected={selectedIds.includes(student.id)}
                            onSelect={(selected) => toggleSelection(student.id, selected)}
                            showCheckbox={false}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Card View */}
          {viewMode === "card" && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {allStudents.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  isSelected={selectedIds.includes(student.id)}
                  onSelect={(selected) => toggleSelection(student.id, selected)}
                  onDelete={() => refetch()}
                />
              ))}
            </div>
          )}

          {/* Grid View */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {allStudents.map((student) => (
                <StudentGrid
                  key={student.id}
                  student={student}
                  isSelected={selectedIds.includes(student.id)}
                  onSelect={(selected) => toggleSelection(student.id, selected)}
                />
              ))}
            </div>
          )}

          {/* Load More */}
          {hasNextPage && (
            <div
              ref={loadMoreRef}
              className="flex items-center justify-center py-8"
            >
              {isFetchingNextPage ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              ) : (
                <button
                  onClick={() => fetchNextPage()}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Load More
                </button>
              )}
            </div>
          )}

          {/* End of List */}
          {!hasNextPage && allStudents.length > 0 && (
            <div className="text-center py-8 text-sm text-gray-500">
              Showing all {allStudents.length} students
            </div>
          )}
        </>
      )}

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        students={allStudents}
        selectedIds={selectedIds}
      />
    </div>
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <StudentsContent />
    </Suspense>
  );
}
