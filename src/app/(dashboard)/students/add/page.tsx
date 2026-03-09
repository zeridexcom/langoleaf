"use client";

import { useState } from "react";
import { ArrowLeft, Upload, User, Mail, Phone, BookOpen, Building2, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const programs = [
  "MBA",
  "B.Tech",
  "M.Tech",
  "BCA",
  "MCA",
  "BBA",
  "B.Com",
  "B.Sc",
  "M.Sc",
  "BA",
  "MA",
  "LLB",
  "MBBS",
  "BDS",
  "Pharmacy",
];

const universities = [
  "IIM Bangalore",
  "IIT Delhi",
  "IIT Bombay",
  "IIT Madras",
  "NIT Trichy",
  "Christ University",
  "XLRI Jamshedpur",
  "BITS Pilani",
  "VIT Vellore",
  "SRM University",
  "Amity University",
  "Manipal University",
];

export default function AddStudentPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    program: "",
    university: "",
    documents: [] as File[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted:", formData);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <a
          href="/students"
          className="p-2 hover:bg-[#252542] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </a>
        <div>
          <h1 className="text-2xl font-bold text-white">Add New Student</h1>
          <p className="text-gray-400">Register a new student for admission</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-dark-surface border border-dark-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-[#ec5b13]" />
            Personal Information
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2 bg-[#252542] border border-dark-border rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/50"
                placeholder="Enter first name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2 bg-[#252542] border border-dark-border rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/50"
                placeholder="Enter last name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-[#252542] border border-dark-border rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/50"
                  placeholder="student@example.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-[#252542] border border-dark-border rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/50"
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="bg-dark-surface border border-dark-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#22d3ee]" />
            Academic Information
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Program
              </label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={formData.program}
                  onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-[#252542] border border-dark-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/50 appearance-none"
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
              <label className="block text-sm font-medium text-white mb-2">
                Preferred University
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-[#252542] border border-dark-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/50 appearance-none"
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

        {/* Document Upload */}
        <div className="bg-dark-surface border border-dark-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-400" />
            Documents
          </h2>
          
          <div className="border-2 border-dashed border-dark-border rounded-xl p-8 text-center hover:border-[#ec5b13]/50 transition-colors cursor-pointer">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-white font-medium mb-1">
              Drop files here or click to upload
            </p>
            <p className="text-xs text-gray-500">
              Supported: PDF, JPG, PNG (Max 10MB each)
            </p>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-4">
          <a
            href="/students"
            className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </a>
          <button
            type="submit"
            className="px-6 py-2 bg-[#ec5b13] text-white rounded-xl hover:bg-[#ec5b13]/90 transition-colors"
          >
            Add Student
          </button>
        </div>
      </form>
    </div>
  );
}
