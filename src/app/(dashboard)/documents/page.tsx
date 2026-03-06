"use client";

import { useState } from "react";
import { FileText, Upload, Download, Trash2, Search, Filter, File, Image, FileSpreadsheet } from "lucide-react";

const documents = [
  {
    id: 1,
    name: "Rahul_Sharma_Transcript.pdf",
    type: "pdf",
    size: "2.4 MB",
    student: "Rahul Sharma",
    uploadedAt: "2024-01-15",
    category: "Academic",
  },
  {
    id: 2,
    name: "Priya_Patel_ID.jpg",
    type: "image",
    size: "1.2 MB",
    student: "Priya Patel",
    uploadedAt: "2024-01-14",
    category: "ID Proof",
  },
  {
    id: 3,
    name: "Amit_Kumar_Resume.docx",
    type: "doc",
    size: "856 KB",
    student: "Amit Kumar",
    uploadedAt: "2024-01-10",
    category: "Resume",
  },
  {
    id: 4,
    name: "Sneha_Gupta_Marksheet.xlsx",
    type: "spreadsheet",
    size: "45 KB",
    student: "Sneha Gupta",
    uploadedAt: "2024-01-08",
    category: "Academic",
  },
];

const getFileIcon = (type: string) => {
  switch (type) {
    case "pdf":
      return <FileText className="w-8 h-8 text-red-400" />;
    case "image":
      return <Image className="w-8 h-8 text-blue-400" />;
    case "doc":
      return <FileText className="w-8 h-8 text-blue-600" />;
    case "spreadsheet":
      return <FileSpreadsheet className="w-8 h-8 text-emerald-400" />;
    default:
      return <File className="w-8 h-8 text-gray-400" />;
  }
};

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.student.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Documents</h1>
          <p className="text-gray-400 mt-1">Manage student documents and uploads</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#6d28d9] text-white rounded-xl hover:bg-[#6d28d9]/90 transition-colors">
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/50"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/50"
        >
          <option value="all">All Categories</option>
          <option value="Academic">Academic</option>
          <option value="ID Proof">ID Proof</option>
          <option value="Resume">Resume</option>
        </select>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.map((doc) => (
          <div
            key={doc.id}
            className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl p-4 hover:border-[#6d28d9]/50 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#252542] rounded-xl">
                {getFileIcon(doc.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{doc.name}</p>
                <p className="text-xs text-gray-400 mt-1">{doc.student}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">{doc.size}</span>
                  <span className="w-1 h-1 bg-gray-500 rounded-full" />
                  <span className="text-xs text-gray-500">{doc.uploadedAt}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#2d2d4a]">
              <button className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#252542] rounded-lg transition-colors">
                <Download className="w-4 h-4" />
                Download
              </button>
              <button className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12 bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl">
          <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No documents found</p>
        </div>
      )}
    </div>
  );
}
