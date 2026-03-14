"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  BookOpen, 
  Building2, 
  GraduationCap, 
  Calendar, 
  User, 
  FileText, 
  MapPin,
  MessageSquare
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DocumentList } from "@/components/documents/document-list";
import { DocumentUpload } from "@/components/documents/document-upload";
import { ActivityTimeline } from "@/components/students/activity-timeline";
import { NotesList } from "@/components/students/notes-list";
import { QuickActionsPanel } from "@/components/students/quick-actions-panel";
import { ProfileCompletionWidget } from "@/components/students/profile-completion-widget";
import { DocumentGallery } from "@/components/students/document-gallery";
import { RequiredDocumentsChecklist } from "@/components/students/required-documents-checklist";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCard } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const requiredDocumentTypes = [
  { type: "passport", label: "Passport" },
  { type: "transcript", label: "Academic Transcript" },
  { type: "recommendation_letter", label: "Recommendation Letter" },
  { type: "personal_statement", label: "Personal Statement" },
  { type: "language_test", label: "Language Test Results" },
  { type: "financial_proof", label: "Financial Proof" },
];

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  
  const [student, setStudent] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);

  useEffect(() => {
    loadStudent();
    loadDocuments();
  }, [studentId]);

  async function loadStudent() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("students")
        .select("*, applications(*)")
        .eq("id", studentId)
        .single();

      if (error) throw error;
      setStudent(data);
    } catch (error) {
      console.error("Error loading student:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadDocuments() {
    try {
      const response = await fetch(`/api/documents?studentId=${studentId}`);
      const result = await response.json();
      if (response.ok) {
        setDocuments(result.documents || []);
      }
    } catch (error) {
      console.error("Error loading documents:", error);
    }
  }

  const handleDelete = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", studentId);

      if (error) throw error;
      
      router.push("/students");
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete student");
    }
  };

  const handleDocumentUpload = () => {
    setRefreshKey(prev => prev + 1);
    setShowUploadModal(false);
    loadDocuments();
  };

  const handleStatusChange = (newStatus: string) => {
    setStudent((prev: any) => ({ ...prev, status: newStatus }));
  };

  const handleQuickNote = () => {
    // Scroll to notes section
    document.getElementById("notes-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScheduleReminder = () => {
    setShowReminderModal(true);
  };

  const getRequiredDocuments = () => {
    return requiredDocumentTypes.map(req => {
      const uploaded = documents.find(d => d.type === req.type);
      return {
        type: req.type,
        label: req.label,
        isUploaded: !!uploaded,
        isVerified: uploaded?.status === "verified",
        expiryDate: uploaded?.expiryDate,
        isExpiringSoon: uploaded?.isExpiringSoon,
      };
    });
  };

  const getImageDocuments = () => {
    return documents
      .filter(d => ["jpg", "jpeg", "png"].includes(d.format?.toLowerCase()))
      .map(d => ({
        src: d.url,
        alt: d.typeLabel,
        title: d.typeLabel,
      }));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <SkeletonCard />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="space-y-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="max-w-7xl mx-auto">
        <EmptyState
          title="Student not found"
          description="The student you're looking for doesn't exist or you don't have access."
          action={{
            label: "Back to Students",
            href: "/students",
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title={student.name}
        description={student.email}
        backHref="/students"
        actions={
          <>
            <Button variant="outline" asChild>
              <a href={`/students/${studentId}/edit`} className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Edit
              </a>
            </Button>
            <Button 
              variant="outline" 
              className="text-red-600 border-red-300 hover:bg-red-50"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </>
        }
      />

      {/* Status Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Current Status</span>
            <StatusBadge status={student.status} />
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Added on</p>
            <p className="font-medium text-gray-900">{new Date(student.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Notes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* Personal Information */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoItem icon={User} label="Full Name" value={student.name} />
                  <InfoItem icon={Mail} label="Email" value={student.email} />
                  <InfoItem icon={Phone} label="Phone" value={student.phone || "Not provided"} />
                  <InfoItem icon={Calendar} label="Date of Birth" value={student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : "Not provided"} />
                  <InfoItem icon={MapPin} label="Address" value={student.address ? `${student.address}, ${student.city}, ${student.state}` : "Not provided"} />
                </div>
              </div>

              {/* Academic Information */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-accent" />
                  Academic Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoItem icon={BookOpen} label="Program" value={student.program || "Not specified"} />
                  <InfoItem icon={Building2} label="University" value={student.university || "Not specified"} />
                  <InfoItem icon={GraduationCap} label="Previous Education" value={student.previous_education || "Not provided"} />
                </div>
              </div>

              {/* Image Gallery */}
              {getImageDocuments().length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <DocumentGallery images={getImageDocuments()} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="documents" className="mt-6 space-y-6">
              {/* Required Documents Checklist */}
              <RequiredDocumentsChecklist
                documents={getRequiredDocuments()}
                onUploadClick={() => setShowUploadModal(true)}
              />

              {/* Document List */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    All Documents
                  </h2>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="text-sm text-primary hover:text-primary/80 font-medium"
                  >
                    + Upload New
                  </button>
                </div>
                <DocumentList 
                  studentId={studentId} 
                  refreshKey={refreshKey}
                  showVerification={true}
                />
              </div>
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <ActivityTimeline studentId={studentId} />
            </TabsContent>

            <TabsContent value="notes" className="mt-6">
              <div id="notes-section">
                <NotesList studentId={studentId} />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <QuickActionsPanel
            studentId={studentId}
            currentStatus={student.status}
            onStatusChange={handleStatusChange}
            onQuickNote={handleQuickNote}
            onDocumentUpload={() => setShowUploadModal(true)}
            onScheduleReminder={handleScheduleReminder}
          />

          {/* Profile Completion */}
          <ProfileCompletionWidget
            student={student}
            documentsCount={documents.length}
            onEdit={() => router.push(`/students/${studentId}/edit`)}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Student?</h3>
            <p className="text-gray-500 mb-6">
              Are you sure you want to delete <strong>{student.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload Documents</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ×
              </button>
            </div>
            <DocumentUpload 
              studentId={studentId} 
              onUploadComplete={handleDocumentUpload}
            />
          </div>
        </div>
      )}

      {/* Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Schedule Reminder</h3>
            <p className="text-gray-500 mb-4">
              Set a follow-up reminder for {student.name}.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reminder Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  rows={3}
                  placeholder="What should you remember?"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowReminderModal(false)}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowReminderModal(false);
                  alert("Reminder scheduled!");
                }}
                className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}
