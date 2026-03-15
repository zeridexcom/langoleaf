"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  User,
  Mail,
  Phone,
  BookOpen,
  Building2,
  GraduationCap,
  CheckCircle,
  Calendar,
  MapPin,
  Heart,
  Tag,
  AlertCircle,
  Save,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { DocumentUpload } from "@/components/documents/document-upload";
import { DocumentList } from "@/components/documents/document-list";
import { createClient } from "@/lib/supabase/client";
import { useDuplicateCheck, useRealtimeDuplicateCheck } from "@/hooks/useDuplicateCheck";
import {
  useBulkDeleteStudents,
  useBulkUpdateStatus,
  useCreateStudent,
} from "@/hooks/useStudents";
import { DuplicateWarningModal } from "@/components/students/duplicate-warning-modal";
import { useFormDraft } from "@/hooks/useFormDraft";
import { TagInput, STUDENT_TAG_SUGGESTIONS } from "@/components/ui/tag-input";
import { AvatarUpload } from "@/components/students/avatar-upload";
import { FormProgress, STUDENT_FORM_SECTIONS } from "@/components/students/form-progress";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-hot-toast";

const programs = [
  "MBA", "B.Tech", "M.Tech", "BCA", "MCA", "BBA", "B.Com", "B.Sc", "M.Sc", "BA", "MA", "LLB", "MBBS", "BDS", "Pharmacy",
  "B.A.Sc", "B.Sc Nursing", "BA(LLB)", "B.Pharmacy", "BPT", "Diploma", "12th", "SSLC"
];

const universities = [
  "IIM Bangalore", "IIT Delhi", "IIT Bombay", "IIT Madras", "NIT Trichy", "Christ University",
  "XLRI Jamshedpur", "BITS Pilani", "VIT Vellore", "SRM University", "Amity University", "Manipal University",
  "Rosy Royal Institutions", "Yenepoya University", "Chinmaya Vishwa Vidyapeeth", "Vidya College of Nursing", 
  "ELIMS College", "MET's Group of Institutions", "MES Group of Institutions", "Udupi Group of Institutions",
  "Arni University", "OPJS", "YBN", "MEWAR UNIVERSITY", "NEFTU UNIVERSITY", "Glocal University", "Himalayan University", "Sangai International University",
  "University of Toronto", "University of Melbourne", "University of Manchester"
];

const genders = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const sources = [
  "Website", "Referral", "Social Media", "Walk-in", "Phone Inquiry", "Email", "Advertisement", "Event", "Other",
];

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh",
];

interface FormData {
  // Personal
  name: string;
  email: string;
  phone: string;
  dateOfBirth: Date | null;
  gender: string;
  nationality: string;
  avatarUrl: string;
  
  // Contact
  address: string;
  city: string;
  state: string;
  pincode: string;
  
  // Emergency
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  
  // Academic
  program: string;
  university: string;
  previousEducation: string;
  
  // Additional
  source: string;
  tags: string[];
}

const initialFormData: FormData = {
  name: "",
  email: "",
  phone: "",
  dateOfBirth: null,
  gender: "",
  nationality: "",
  avatarUrl: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelation: "",
  program: "",
  university: "",
  previousEducation: "",
  source: "",
  tags: [],
};

export default function AddStudentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [success, setSuccess] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeSection, setActiveSection] = useState("personal");
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Duplicate check hooks
  const { result, showModal, checkDuplicates, closeModal, clearDuplicates } = useDuplicateCheck();
  const { emailStatus, phoneStatus, duplicateStudent, checkEmail, checkPhone, resetStatus } = useRealtimeDuplicateCheck();
  
  // Create student mutation
  const createStudent = useCreateStudent();
  
  // Draft management
  const { hasDraft, lastSaved, saveDraft, restoreDraft, clearDraft, startAutoSave, getLastSavedText } = useFormDraft({
    formId: "add-student",
    onRestore: (data: any) => {
      // Restore date objects
      const restored: FormData = {
        ...initialFormData,
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      };
      setFormData(restored);
      toast.success("Previous draft restored");
    },
  });

  // Start auto-save when form is mounted
  useEffect(() => {
    const stopAutoSave = startAutoSave(() => formData);
    return () => stopAutoSave();
  }, [startAutoSave]);

  // Pre-fill from URL params (e.g., from Course Hub)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const programParam = urlParams.get("program");
      const universityParam = urlParams.get("university");
      
      if (programParam || universityParam) {
        setFormData(prev => ({
          ...prev,
          program: programParam || prev.program,
          university: universityParam || prev.university
        }));
      }
    }
  }, []);

  // Check for duplicates on blur
  const handleEmailBlur = useCallback(() => {
    if (formData.email) {
      checkEmail(formData.email);
    }
  }, [formData.email, checkEmail]);

  const handlePhoneBlur = useCallback(() => {
    if (formData.phone) {
      checkPhone(formData.phone);
    }
  }, [formData.phone, checkPhone]);

  // Check for all duplicates before submit
  const checkAllDuplicates = useCallback(async () => {
    const result = await checkDuplicates(
      formData.email,
      formData.phone,
      formData.name,
      "" // Empty last name since we use a single field
    );
    return result;
  }, [checkDuplicates, formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (!formData.program) newErrors.program = "Program is required";
    if (!formData.university) newErrors.university = "University is required";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields");
      return;
    }

    // Check for duplicates
    const duplicateCheck = await checkAllDuplicates();
    if (duplicateCheck.hasDuplicates) {
      return; // Modal will be shown
    }

    // Submit using mutation hook
    createStudent.mutate({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      program: formData.program,
      university: formData.university,
      status: "application_submitted",
      freelancer_id: "", // Auto-set by hook from auth
      date_of_birth: formData.dateOfBirth?.toISOString().split("T")[0] || undefined,
      gender: formData.gender || undefined,
      nationality: formData.nationality || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      pincode: formData.pincode || undefined,
      emergency_contact_name: formData.emergencyContactName || undefined,
      emergency_contact_phone: formData.emergencyContactPhone || undefined,
      emergency_contact_relation: formData.emergencyContactRelation || undefined,
      previous_education: formData.previousEducation || undefined,
      source: formData.source || undefined,
      tags: formData.tags,
      notes: "", // Satisfy schema
    }, {
      onSuccess: async (student) => {
        // Sync to Google Sheets
        await fetch("/api/sync-sheets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId: student.id, action: "create" }),
        });

        clearDraft();
        setStudentId(student.id);
        setSuccess(true);
        setShowDocumentUpload(true);
        toast.success("Student added successfully!");
      },
      onError: (error) => {
        console.error("Error creating student:", error);
        toast.error("Failed to create student. Please try again.");
      }
    });
  };

  const handleDocumentUpload = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleViewDuplicate = (id: string) => {
    router.push(`/students/${id}`);
  };

  const handleMergeDuplicate = (id: string) => {
    router.push(`/students/${id}/edit`);
  };

  const handleCancelDuplicate = () => {
    closeModal();
    clearDuplicates();
  };

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (success && studentId) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Added Successfully!</h1>
            <p className="text-gray-500">Now upload documents for {formData.name}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Upload Documents
            </h2>
            <DocumentUpload studentId={studentId} onUploadComplete={handleDocumentUpload} />
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Documents</h2>
            <DocumentList studentId={studentId} refreshKey={refreshKey} />
          </div>

          <div className="flex items-center justify-end gap-4">
            <a href="/students" className="px-6 py-2 text-gray-500 hover:text-gray-700 transition-colors">
              Back to Students
            </a>
            <a href="/students/add" className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
              Add Another Student
            </a>
            <Button
              onClick={() => router.push(`/applications/create?studentId=${studentId}&program=${formData.program}&university=${formData.university}`)}
              className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-bold shadow-lg shadow-primary/20"
            >
              Proceed to Application
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Duplicate Warning Modal */}
      <DuplicateWarningModal
        isOpen={showModal}
        onClose={closeModal}
        onView={handleViewDuplicate}
        onMerge={handleMergeDuplicate}
        onCancel={handleCancelDuplicate}
        emailDuplicate={result?.emailDuplicate || null}
        phoneDuplicate={result?.phoneDuplicate || null}
        nameMatches={result?.nameMatches || []}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <a href="/students" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </a>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Student</h1>
            <p className="text-gray-500">Register a new student for admission</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasDraft && (
            <Button variant="outline" onClick={restoreDraft} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Restore Draft
            </Button>
          )}
          {lastSaved && (
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Save className="w-4 h-4" />
              Saved {getLastSavedText()}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <section id="personal" className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Personal Information
              </h2>

              <div className="space-y-4">
                {/* Avatar Upload */}
                <div className="flex justify-center mb-6">
                  <AvatarUpload
                    value={formData.avatarUrl}
                    onChange={(url) => updateField("avatarUrl", url)}
                  />
                </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className={cn(
                        "w-full px-4 py-2 bg-white border rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50",
                        errors.name ? "border-red-300" : "border-gray-300"
                      )}
                      placeholder="Enter full name"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                    )}
                  </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        onBlur={handleEmailBlur}
                        className={cn(
                          "w-full pl-10 pr-4 py-2 bg-white border rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50",
                          errors.email ? "border-red-300" : emailStatus === "duplicate" ? "border-amber-300" : emailStatus === "available" ? "border-emerald-300" : "border-gray-300"
                        )}
                        placeholder="student@example.com"
                      />
                    </div>
                    {emailStatus === "checking" && (
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Checking...
                      </p>
                    )}
                    {emailStatus === "duplicate" && (
                      <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        This email already exists
                      </p>
                    )}
                    {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        onBlur={handlePhoneBlur}
                        className={cn(
                          "w-full pl-10 pr-4 py-2 bg-white border rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50",
                          errors.phone ? "border-red-300" : phoneStatus === "duplicate" ? "border-amber-300" : phoneStatus === "available" ? "border-emerald-300" : "border-gray-300"
                        )}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    {phoneStatus === "checking" && (
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Checking...
                      </p>
                    )}
                    {phoneStatus === "duplicate" && (
                      <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        This phone number already exists
                      </p>
                    )}
                    {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                      <DatePicker
                        selected={formData.dateOfBirth}
                        onChange={(date: Date | null) => updateField("dateOfBirth", date)}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Select date"
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        showYearDropdown
                        scrollableYearDropdown
                        yearDropdownItemNumber={100}
                        maxDate={new Date()}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => updateField("gender", e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">Select Gender</option>
                      {genders.map((g) => (
                        <option key={g.value} value={g.value}>{g.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nationality
                    </label>
                    <input
                      type="text"
                      value={formData.nationality}
                      onChange={(e) => updateField("nationality", e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="e.g., Indian"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section id="contact" className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-accent" />
                Contact Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    placeholder="Enter full address"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <select
                      value={formData.state}
                      onChange={(e) => updateField("state", e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">Select State</option>
                      {indianStates.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => updateField("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="6 digits"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Emergency Contact */}
            <section id="emergency" className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Emergency Contact
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={(e) => updateField("emergencyContactName", e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => updateField("emergencyContactPhone", e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContactRelation}
                    onChange={(e) => updateField("emergencyContactRelation", e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g., Parent, Spouse"
                  />
                </div>
              </div>
            </section>

            {/* Academic Information */}
            <section id="academic" className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-accent" />
                Academic Information
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Program *
                    </label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        value={formData.program}
                        onChange={(e) => updateField("program", e.target.value)}
                        className={cn(
                          "w-full pl-10 pr-4 py-2 bg-white border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none",
                          errors.program ? "border-red-300" : "border-gray-300"
                        )}
                      >
                        <option value="">Select Program</option>
                        {programs.map((program) => (
                          <option key={program} value={program}>{program}</option>
                        ))}
                      </select>
                    </div>
                    {errors.program && <p className="text-sm text-red-500 mt-1">{errors.program}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred University *
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        value={formData.university}
                        onChange={(e) => updateField("university", e.target.value)}
                        className={cn(
                          "w-full pl-10 pr-4 py-2 bg-white border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none",
                          errors.university ? "border-red-300" : "border-gray-300"
                        )}
                      >
                        <option value="">Select University</option>
                        {universities.map((university) => (
                          <option key={university} value={university}>{university}</option>
                        ))}
                      </select>
                    </div>
                    {errors.university && <p className="text-sm text-red-500 mt-1">{errors.university}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Previous Education
                  </label>
                  <textarea
                    value={formData.previousEducation}
                    onChange={(e) => updateField("previousEducation", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    placeholder="Previous school/college, qualifications, grades, etc."
                  />
                </div>
              </div>
            </section>

            {/* Additional Information */}
            <section id="additional" className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Tag className="w-5 h-5 text-orange-500" />
                Additional Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referral Source
                  </label>
                  <select
                    value={formData.source}
                    onChange={(e) => updateField("source", e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Select Source</option>
                    {sources.map((source) => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <TagInput
                    tags={formData.tags}
                    onChange={(tags) => updateField("tags", tags)}
                    suggestions={STUDENT_TAG_SUGGESTIONS}
                    placeholder="Add tags (press Enter)"
                    maxTags={10}
                  />
                </div>
              </div>
            </section>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-4 pt-4">
              <a href="/students" className="px-6 py-2 text-gray-500 hover:text-gray-700 transition-colors">
                Cancel
              </a>
              <Button
                type="submit"
                disabled={createStudent.isPending}
                className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {createStudent.isPending ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    Adding...
                  </>
                ) : (
                  "Add Student"
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Sidebar - Progress */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            <FormProgress
              formData={{
                ...formData,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                dateOfBirth: formData.dateOfBirth,
                gender: formData.gender,
                nationality: formData.nationality,
                avatarUrl: formData.avatarUrl,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode,
                emergencyContactName: formData.emergencyContactName,
                emergencyContactPhone: formData.emergencyContactPhone,
                emergencyContactRelation: formData.emergencyContactRelation,
                program: formData.program,
                university: formData.university,
                previousEducation: formData.previousEducation,
                workExperience: "",
                source: formData.source,
                tags: formData.tags,
              }}
              sections={STUDENT_FORM_SECTIONS}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
