"use client";

import { useState } from "react";
import { ArrowLeft, Upload, User, Mail, Phone, BookOpen, Building2, GraduationCap, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { DocumentUpload } from "@/components/documents/document-upload";
import { DocumentList } from "@/components/documents/document-list";
import { createClient } from "@/lib/supabase/client";

const programs = [
  "MBA", "B.Tech", "M.Tech", "BCA", "MCA", "BBA", "B.Com", "B.Sc", "M.Sc", "BA", "MA", "LLB", "MBBS", "BDS", "Pharmacy",
];

const universities = [
  "IIM Bangalore", "IIT Delhi", "IIT Bombay", "IIT Madras", "NIT Trichy", "Christ University",
  "XLRI Jamshedpur", "BITS Pilani", "VIT Vellore", "SRM University", "Amity University", "Manipal University",
];

export default function AddStudentPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    program: "",
    university: "",
  });
  const [studentId, setStudentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [success, setSuccess] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("Please login first");
        return;
      }

      // Create student in database
      const { data: student, error } = await supabase
        .from("students")
        .insert({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          program: formData.program,
          university: formData.university,
          status: "application_submitted",
          freelancer_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Sync to Google Sheets
      await fetch("/api/sync-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id, action: "create" }),
      });

      setStudentId(student.id);
      setSuccess(true);
      setShowDocumentUpload(true);
    } catch (error) {
      console.error("Error creating student:", error);
      alert("Failed to create student. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDocumentUpload = () => {
    // Refresh document list after upload by incrementing refreshKey
    setRefreshKey(prev => prev + 1);
  };

  if (success && studentId) {
    return (
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Added Successfully!</h1>
            <p className="text-gray-500">Now upload documents for {formData.firstName} {formData.lastName}</p>
          </div>
        </div>

        {/* Document Upload Section */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Upload Documents
            </h2>
            <DocumentUpload 
              studentId={studentId} 
              onUploadComplete={handleDocumentUpload}
            />
          </div>

          {/* Document List */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Uploaded Documents
            </h2>
            <DocumentList studentId={studentId} refreshKey={refreshKey} />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <a
              href="/students"
              className="px-6 py-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              Back to Students
            </a>
            <a
              href={`/students/add`}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Add Another Student
            </a>
            <a
              href="/students"
              className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium"
            >
              Finish
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <a
          href="/students"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </a>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Student</h1>
          <p className="text-gray-500">Register a new student for admission</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Personal Information
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Enter first name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Enter last name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="student@example.com"
                  required
                />
              </div>
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
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Program *
              </label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={formData.program}
                  onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                  required
                >
                  <option value="">Select Program</option>
                  {programs.map((program) => (
                    <option key={program} value={program}>
                      {program}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred University *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                  required
                >
                  <option value="">Select University</option>
                  {universities.map((university) => (
                    <option key={university} value={university}>
                      {university}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-4">
          <a
            href="/students"
            className="px-6 py-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </a>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Adding...
              </>
            ) : (
              "Add Student"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
