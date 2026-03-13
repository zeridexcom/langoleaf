import * as XLSX from "xlsx";
import { Student } from "@/hooks/useStudents";

export type ExportFormat = "csv" | "xlsx" | "json";

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  fields?: string[];
  includeApplications?: boolean;
}

const defaultFields = [
  "name",
  "email",
  "phone",
  "program",
  "university",
  "status",
  "source",
  "tags",
  "created_at",
  "updated_at",
];

const fieldLabels: Record<string, string> = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  program: "Program",
  university: "University",
  status: "Status",
  source: "Source",
  tags: "Tags",
  created_at: "Created At",
  updated_at: "Updated At",
  date_of_birth: "Date of Birth",
  gender: "Gender",
  nationality: "Nationality",
  address: "Address",
  city: "City",
  state: "State",
  pincode: "Pincode",
  emergency_contact_name: "Emergency Contact Name",
  emergency_contact_phone: "Emergency Contact Phone",
  previous_education: "Previous Education",
  work_experience: "Work Experience",
  profile_completion: "Profile Completion",
};

function formatValue(value: any, field: string): string {
  if (value === null || value === undefined) return "";
  
  if (field === "created_at" || field === "updated_at" || field === "date_of_birth") {
    return new Date(value).toLocaleDateString();
  }
  
  if (field === "tags" && Array.isArray(value)) {
    return value.join(", ");
  }
  
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  
  return String(value);
}

function flattenStudent(student: Student, includeApplications: boolean): Record<string, any> {
  const flat: Record<string, any> = {};
  
  // Add all student fields
  Object.keys(fieldLabels).forEach((field) => {
    flat[field] = formatValue(student[field as keyof Student], field);
  });
  
  // Add application data if requested
  if (includeApplications && student.applications && student.applications.length > 0) {
    student.applications.forEach((app, index) => {
      flat[`application_${index + 1}_program`] = app.program || "";
      flat[`application_${index + 1}_university`] = app.university || "";
      flat[`application_${index + 1}_status`] = app.status || "";
      flat[`application_${index + 1}_commission`] = app.commission_amount || "";
    });
  }
  
  return flat;
}

export function exportStudents(students: Student[], options: ExportOptions): void {
  const fields = options.fields || defaultFields;
  const includeApplications = options.includeApplications ?? false;
  const filename = options.filename || `students_export_${new Date().toISOString().split("T")[0]}`;
  
  // Flatten data
  const data = students.map((student) => flattenStudent(student, includeApplications));
  
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data, {
    header: fields,
  });
  
  // Set column headers with labels
  const headers = fields.map((field) => fieldLabels[field] || field);
  XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A1" });
  
  // Auto-size columns
  const colWidths = fields.map((field) => ({
    wch: Math.max(
      (fieldLabels[field] || field).length,
      ...data.map((row) => String(row[field] || "").length)
    ) + 2,
  }));
  worksheet["!cols"] = colWidths;
  
  switch (options.format) {
    case "csv":
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      downloadFile(csv, `${filename}.csv`, "text/csv");
      break;
      
    case "xlsx":
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      break;
      
    case "json":
      const json = JSON.stringify(students, null, 2);
      downloadFile(json, `${filename}.json`, "application/json");
      break;
  }
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getExportFields(): { value: string; label: string }[] {
  return Object.entries(fieldLabels).map(([value, label]) => ({
    value,
    label,
  }));
}
