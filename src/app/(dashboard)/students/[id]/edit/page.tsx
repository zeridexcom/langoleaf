"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  BookOpen, 
  Building2, 
  GraduationCap, 
  Loader2, 
  RotateCcw,
  AlertCircle,
  Check,
  History,
  Save,
  FileText
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useChangeTracking } from "@/hooks/useChangeTracking";
import { ChangeSummaryModal } from "@/components/students/change-summary-modal";
import { UnsavedChangesModal } from "@/components/students/unsaved-changes-modal";
import { useFormDraft } from "@/hooks/useFormDraft";
import { createStudentSchema, formatZodErrors } from "@/lib/validations/student";
import { ZodError } from "zod";
import { toast } from "react-hot-toast";

const programs = [
  "MBA", "B.Tech", "M.Tech", "BCA", "MCA", "BBA", "B.Com", "B.Sc", "M.Sc", "BA", "MA", "LLB", "MBBS", "BDS", "Pharmacy",
];

const universities = [
  "IIM Bangalore", "IIT Delhi", "IIT Bombay", "IIT Madras", "NIT Trichy", "Christ University",
  "XLRI Jamshedpur", "BITS Pilani", "VIT Vellore", "SRM University", "Amity University", "Manipal University",
];

const statuses = [
  { value: "application_submitted", label: "Application Submitted" },
  { value: "documents_pending", label: "Documents Pending" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "enrolled", label: "Enrolled" },
  { value: "rejected", label: "Rejected" },
];

interface FormData {
  name: string;
  email: string;
  phone: string;
  program: string;
  university: string;
  status: string;
}

interface LastEditor {
  name: string;
  email: string;
  updatedAt: string;
}

export default function EditStudentPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  
  const [originalData, setOriginalData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showChangeSummary, setShowChangeSummary] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [lastEditor, setLastEditor] = useState<LastEditor | null>(null);
  const [recentEdits, setRecentEdits] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  
  const {
    currentData,
    updateField,
    markTouched,
    isFieldModified,
    isFieldTouched,
    getOldValue,
    undoField,
    undoAll,
    hasChanges,
    getChangesSummary,
    modifiedFields,
  } = useChangeTracking<FormData>(originalData || {
    name: "",
    email: "",
    phone: "",
    program: "",
    university: "",
    status: "",
  });

  const {
    saveDraft,
    clearDraft,
    hasDraft,
    getLastSavedText,
  } = useFormDraft({
    formId: `student-edit-${studentId}`,
  });

  // Load student data
  useEffect(() => {
    loadStudent();
    loadLastEditor();
    loadRecentEdits();
  }, [studentId]);

  // Beforeunload handler for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  async function loadStudent() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .single();

      if (error) throw error;
      
      const formData: FormData = {
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        program: data.program || "",
        university: data.university || "",
        status: data.status || "application_submitted",
      };
      
      setOriginalData(formData);
    } catch (error) {
      console.error("Error loading student:", error);
      toast.error("Failed to load student data");
    } finally {
      setLoading(false);
    }
  }

  async function loadLastEditor() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("activity_log")
        .select(`
          created_at,
          freelancer_id,
          profiles:freelancer_id (
            full_name,
            email
          )
        `)
        .eq("student_id", studentId)
        .eq("action", "profile_updated")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) return;
      
      // Handle profiles as potentially an array from Supabase
      const profiles = data?.profiles;
      const profile = Array.isArray(profiles) ? profiles[0] : profiles;
      
      if (profile) {
        setLastEditor({
          name: profile.full_name || "Unknown",
          email: profile.email || "",
          updatedAt: data.created_at,
        });
      }
    } catch (error) {
      console.error("Error loading last editor:", error);
    }
  }

  async function loadRecentEdits() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("activity_log")
        .select(`
          id,
          action,
          old_values,
          new_values,
          created_at,
          profiles:freelancer_id (
            full_name
          )
        `)
        .eq("student_id", studentId)
        .eq("action", "profile_updated")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      
      setRecentEdits(data || []);
    } catch (error) {
      console.error("Error loading recent edits:", error);
    }
  }

  // Validate field on blur
  const validateField = useCallback((field: keyof FormData, value: any) => {
    try {
      const schemaField = field === "name" ? "fullName" : field;
      const fieldSchema = (createStudentSchema.shape as any)[schemaField];
      if (fieldSchema) {
        fieldSchema.parse(value);
      }
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    } catch (error) {
      if (error instanceof ZodError) {
        setErrors((prev) => ({
          ...prev,
          [field]: error.errors[0]?.message || "Invalid value",
        }));
      }
    }
  }, []);

  const handleFieldChange = (field: keyof FormData, value: string) => {
    updateField(field, value);
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleFieldBlur = (field: keyof FormData) => {
    markTouched(field);
    validateField(field, currentData[field]);
  };

  const handleSaveClick = () => {
    if (Object.keys(errors).length > 0) {
      toast.error("Please fix validation errors before saving");
      return;
    }
    setShowChangeSummary(true);
  };

  const handleConfirmSave = async () => {
    setSaving(true);
    setShowChangeSummary(false);

    try {
      const supabase = createClient();
      
      // Get changes for activity log
      const changes = getChangesSummary();
      const oldValues: Record<string, any> = {};
      const newValues: Record<string, any> = {};
      
      changes.forEach((change) => {
        oldValues[change.field] = getOldValue(change.field);
        newValues[change.field] = currentData[change.field as keyof FormData];
      });

      // Update student
      const { error } = await supabase
        .from("students")
        .update({
          name: currentData.name,
          email: currentData.email,
          phone: currentData.phone,
          program: currentData.program,
          university: currentData.university,
          status: currentData.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", studentId);

      if (error) throw error;

      // Log activity
      await supabase.from("activity_log").insert({
        student_id: studentId,
        action: "profile_updated",
        entity_type: "student",
        entity_id: studentId,
        old_values: oldValues,
        new_values: newValues,
        details: {
          fields_updated: changes.map((c) => c.field),
        },
      });

      // Sync to Google Sheets
      await fetch("/api/sync-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, action: "update" }),
      });

      // Clear draft after successful save
      clearDraft();

      toast.success("Student updated successfully");
      
      // Navigate to student detail page
      router.push(`/students/${studentId}`);
    } catch (error) {
      console.error("Error updating student:", error);
      toast.error("Failed to update student. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsDraft = () => {
    saveDraft(currentData, true);
    setShowUnsavedModal(false);
    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
  };

  const handleDiscard = () => {
    setShowUnsavedModal(false);
    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
  };

  const handleNavigation = (href: string) => {
    if (hasChanges) {
      setPendingNavigation(href);
      setShowUnsavedModal(true);
    } else {
      router.push(href);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const changesSummary = getChangesSummary();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleNavigation(`/students/${studentId}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Student</h1>
            {lastEditor && (
              <p className="text-sm text-gray-500">
                Last edited by <span className="font-medium text-gray-700">{lastEditor.name}</span>{" "}
                {formatDate(lastEditor.updatedAt)}
              </p>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {hasChanges && (
            <button
              onClick={() => undoAll()}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Undo All
            </button>
          )}
          
          <button
            onClick={handleSaveClick}
            disabled={saving || !hasChanges || Object.keys(errors).length > 0}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
                {hasChanges && (
                  <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                    {modifiedFields.size}
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Personal Information
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name Field */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={currentData.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    onBlur={() => handleFieldBlur("name")}
                    className={`w-full px-4 py-2 bg-white border rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${
                      isFieldModified("name")
                        ? "border-amber-400 bg-amber-50/30"
                        : errors.name
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter full name"
                  />
                  {isFieldModified("name") && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 group">
                      <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                      {/* Tooltip */}
                      <div className="absolute right-0 top-8 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <p className="font-medium mb-1">Previous value:</p>
                        <p className="text-gray-300 line-through">{getOldValue("name") || "Empty"}</p>
                        <button
                          onClick={() => undoField("name")}
                          className="mt-2 text-amber-400 hover:text-amber-300 flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Undo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={currentData.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    onBlur={() => handleFieldBlur("email")}
                    className={`w-full pl-10 pr-4 py-2 bg-white border rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${
                      isFieldModified("email")
                        ? "border-amber-400 bg-amber-50/30"
                        : errors.email
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="student@example.com"
                  />
                  {isFieldModified("email") && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 group">
                      <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                      <div className="absolute right-0 top-8 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <p className="font-medium mb-1">Previous value:</p>
                        <p className="text-gray-300 line-through">{getOldValue("email") || "Empty"}</p>
                        <button
                          onClick={() => undoField("email")}
                          className="mt-2 text-amber-400 hover:text-amber-300 flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Undo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={currentData.phone}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                    onBlur={() => handleFieldBlur("phone")}
                    className={`w-full pl-10 pr-4 py-2 bg-white border rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${
                      isFieldModified("phone")
                        ? "border-amber-400 bg-amber-50/30"
                        : errors.phone
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="+91 98765 43210"
                  />
                  {isFieldModified("phone") && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 group">
                      <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                      <div className="absolute right-0 top-8 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <p className="font-medium mb-1">Previous value:</p>
                        <p className="text-gray-300 line-through">{getOldValue("phone") || "Empty"}</p>
                        <button
                          onClick={() => undoField("phone")}
                          className="mt-2 text-amber-400 hover:text-amber-300 flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Undo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-accent" />
              Academic Information
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Program Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={currentData.program}
                    onChange={(e) => handleFieldChange("program", e.target.value)}
                    onBlur={() => handleFieldBlur("program")}
                    className={`w-full pl-10 pr-4 py-2 bg-white border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none transition-colors ${
                      isFieldModified("program")
                        ? "border-amber-400 bg-amber-50/30"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">Select Program</option>
                    {programs.map((program) => (
                      <option key={program} value={program}>
                        {program}
                      </option>
                    ))}
                  </select>
                  {isFieldModified("program") && (
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 group">
                      <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                      <div className="absolute right-0 top-8 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <p className="font-medium mb-1">Previous value:</p>
                        <p className="text-gray-300 line-through">{getOldValue("program") || "Empty"}</p>
                        <button
                          onClick={() => undoField("program")}
                          className="mt-2 text-amber-400 hover:text-amber-300 flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Undo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* University Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  University
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={currentData.university}
                    onChange={(e) => handleFieldChange("university", e.target.value)}
                    onBlur={() => handleFieldBlur("university")}
                    className={`w-full pl-10 pr-4 py-2 bg-white border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none transition-colors ${
                      isFieldModified("university")
                        ? "border-amber-400 bg-amber-50/30"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">Select University</option>
                    {universities.map((university) => (
                      <option key={university} value={university}>
                        {university}
                      </option>
                    ))}
                  </select>
                  {isFieldModified("university") && (
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 group">
                      <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                      <div className="absolute right-0 top-8 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <p className="font-medium mb-1">Previous value:</p>
                        <p className="text-gray-300 line-through">{getOldValue("university") || "Empty"}</p>
                        <button
                          onClick={() => undoField("university")}
                          className="mt-2 text-amber-400 hover:text-amber-300 flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Undo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              Application Status
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Status *
              </label>
              <div className="relative">
                <select
                  value={currentData.status}
                  onChange={(e) => handleFieldChange("status", e.target.value)}
                  onBlur={() => handleFieldBlur("status")}
                  className={`w-full px-4 py-2 bg-white border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${
                    isFieldModified("status")
                      ? "border-amber-400 bg-amber-50/30"
                      : "border-gray-300"
                  }`}
                >
                  {statuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                {isFieldModified("status") && (
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 group">
                    <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                    <div className="absolute right-0 top-8 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      <p className="font-medium mb-1">Previous value:</p>
                      <p className="text-gray-300 line-through">
                        {statuses.find(s => s.value === getOldValue("status"))?.label || getOldValue("status")}
                      </p>
                      <button
                        onClick={() => undoField("status")}
                        className="mt-2 text-amber-400 hover:text-amber-300 flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Undo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Changes Summary Card */}
          {hasChanges && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <h3 className="font-semibold text-amber-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Pending Changes
              </h3>
              <ul className="space-y-2">
                {changesSummary.map((change) => (
                  <li key={change.field} className="text-sm">
                    <span className="font-medium text-amber-800">{change.label}</span>
                    <div className="flex items-center gap-2 text-amber-700 mt-1">
                      <span className="line-through text-amber-600/70">{change.oldValue}</span>
                      <span>→</span>
                      <span className="font-medium">{change.newValue}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recent Edits */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-gray-500" />
              Recent Edits
            </h3>
            {recentEdits.length === 0 ? (
              <p className="text-sm text-gray-500">No recent edits</p>
            ) : (
              <ul className="space-y-3">
                {recentEdits.map((edit) => (
                  <li key={edit.id} className="text-sm border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                    <p className="font-medium text-gray-700">
                      {edit.profiles?.full_name || "Unknown"}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {formatDate(edit.created_at)}
                    </p>
                    {edit.old_values && edit.new_values && (
                      <div className="mt-1 text-xs text-gray-600">
                        {Object.keys(edit.new_values).map((key) => (
                          <span key={key} className="inline-flex items-center gap-1 mr-2">
                            <FileText className="w-3 h-3" />
                            {key}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Draft Status */}
          {hasDraft && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Save className="w-5 h-5" />
                Draft Available
              </h3>
              <p className="text-sm text-blue-700 mb-3">
                You have unsaved changes from a previous session.
              </p>
              <button
                onClick={() => {/* Restore draft logic */}}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Restore Draft
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ChangeSummaryModal
        isOpen={showChangeSummary}
        onClose={() => setShowChangeSummary(false)}
        onConfirm={handleConfirmSave}
        onCancel={() => setShowChangeSummary(false)}
        changes={changesSummary}
        studentName={currentData.name}
        isSaving={saving}
      />

      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onClose={() => {
          setShowUnsavedModal(false);
          setPendingNavigation(null);
        }}
        onSave={() => {
          setShowUnsavedModal(false);
          handleSaveClick();
        }}
        onSaveAsDraft={handleSaveAsDraft}
        onDiscard={handleDiscard}
        changeCount={modifiedFields.size}
      />
    </div>
  );
}
