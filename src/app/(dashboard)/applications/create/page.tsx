"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FileText, User, Building2, Upload, CheckCircle, Loader2 } from "lucide-react";
import { useStudents, useStudent } from "@/hooks/useStudents";
import { useCreateApplication } from "@/hooks/useApplications";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

const universities = [
  "IIM Bangalore", "IIT Delhi", "IIT Bombay", "IIT Madras", "NIT Trichy", "Christ University",
  "XLRI Jamshedpur", "BITS Pilani", "VIT Vellore", "SRM University", "Amity University", "Manipal University",
  "Rosy Royal Institutions", "Yenepoya University", "Chinmaya Vishwa Vidyapeeth", "Vidya College of Nursing", 
  "ELIMS College", "MET's Group of Institutions", "MES Group of Institutions", "Udupi Group of Institutions",
  "Arni University", "OPJS", "YBN", "MEWAR UNIVERSITY", "NEFTU UNIVERSITY", "Glocal University", "Himalayan University", "Sangai International University",
  "University of Toronto", "University of Melbourne", "University of Manchester"
];

const programs = [
  "MBA", "B.Tech", "M.Tech", "BCA", "MCA", "BBA", "B.Com", "B.Sc", "M.Sc", "BA", "MA", "LLB", "MBBS", "BDS", "Pharmacy",
  "B.A.Sc", "B.Sc Nursing", "BA(LLB)", "B.Pharmacy", "BPT", "Diploma", "12th", "SSLC"
];

function CreateApplicationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentIdParam = searchParams.get("studentId");
  const programParam = searchParams.get("program");
  const universityParam = searchParams.get("university");

  const [formData, setFormData] = useState({
    studentId: studentIdParam || "",
    universityId: universityParam || "", // Using name as ID for now as per schema
    programId: programParam || "",
    intakeDate: "",
    notes: "",
  });

  const { data: students, isLoading: studentsLoading } = useStudents();
  const { data: selectedStudent, isLoading: studentLoading } = useStudent(formData.studentId);
  const createApplication = useCreateApplication();

  useEffect(() => {
    if (studentIdParam) setFormData(prev => ({ ...prev, studentId: studentIdParam }));
    if (programParam) setFormData(prev => ({ ...prev, programId: programParam }));
    if (universityParam) setFormData(prev => ({ ...prev, universityId: universityParam }));
  }, [studentIdParam, programParam, universityParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.studentId || !formData.universityId || !formData.programId) {
      toast.error("Please fill in all required fields");
      return;
    }

    createApplication.mutate({
      studentId: formData.studentId,
      universityId: formData.universityId,
      programId: formData.programId,
      intakeDate: formData.intakeDate,
    }, {
      onSuccess: () => {
        toast.success("Application created successfully!");
        router.push("/applications");
      },
      onError: (error) => {
        console.error("Error creating application:", error);
        toast.error("Failed to create application. Please try again.");
      }
    });
  };

  if (studentsLoading || (formData.studentId && studentLoading)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Application</h1>
          <p className="text-gray-500">Submit a new application for {selectedStudent?.full_name || "a student"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Student Select */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Select Student
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Student *</label>
            <select
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
              disabled={!!studentIdParam}
            >
              <option value="">Select a student</option>
              {students?.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.full_name} ({student.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Application Details */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Application Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">University *</label>
              <select
                value={formData.universityId}
                onChange={(e) => setFormData({ ...formData, universityId: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              >
                <option value="">Select University</option>
                {universities.map((uni) => (
                  <option key={uni} value={uni}>{uni}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Program *</label>
              <select
                value={formData.programId}
                onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              >
                <option value="">Select Program</option>
                {programs.map((prog) => (
                  <option key={prog} value={prog}>{prog}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Intake Month/Year</label>
            <input
              type="text"
              value={formData.intakeDate}
              onChange={(e) => setFormData({ ...formData, intakeDate: e.target.value })}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. September 2024"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={createApplication.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createApplication.isPending}
            className="gap-2"
          >
            {createApplication.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            Submit Application
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function CreateApplicationPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <CreateApplicationContent />
    </Suspense>
  );
}
