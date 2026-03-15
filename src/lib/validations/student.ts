import { z } from "zod"
import { StudentStatus } from "@/types/database"
import { canTransitionStudent } from "@/lib/state-machines/student-status"

// Phone number validation (international format)
const phoneRegex = /^\+[1-9]\d{1,14}$/

// Email validation
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

// Student statuses
const studentStatuses: StudentStatus[] = [
  "lead",
  "active",
  "inactive",
  "enrolled",
  "archived",
]

// Personal info schema (Step 1 of wizard)
export const personalInfoSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters"),
  
  email: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(phoneRegex, "Please enter a valid phone number with country code (e.g., +1234567890)"),
  
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .optional()
    .or(z.literal(""))
    .refine((val) => {
      if (!val) return true
      const date = new Date(val)
      const now = new Date()
      const age = now.getFullYear() - date.getFullYear()
      return age >= 16 && age <= 100
    }, "Student must be between 16 and 100 years old"),
  
  gender: z
    .enum(["male", "female", "other", "prefer_not_to_say"])
    .optional(),
  
  nationality: z
    .string()
    .min(2, "Nationality must be at least 2 characters")
    .optional(),
  
  address: z
    .string()
    .min(5, "Address must be at least 5 characters")
    .max(500, "Address must be less than 500 characters")
    .optional(),
  
  city: z
    .string()
    .min(2, "City must be at least 2 characters")
    .max(100, "City must be less than 100 characters")
    .optional(),
  
  state: z
    .string()
    .min(2, "State must be at least 2 characters")
    .max(100, "State must be less than 100 characters")
    .optional(),
  
  pincode: z
    .string()
    .max(20, "Pincode must be less than 20 characters")
    .optional(),
  
  country: z
    .string()
    .min(2, "Country must be at least 2 characters")
    .max(100, "Country must be less than 100 characters")
    .optional(),
  
  emergencyContactName: z
    .string()
    .min(2, "Emergency contact name must be at least 2 characters")
    .max(100, "Emergency contact name must be less than 100 characters")
    .optional(),
  
  emergencyContactPhone: z
    .string()
    .regex(phoneRegex, "Please enter a valid phone number with country code")
    .optional()
    .or(z.literal("")),
})

export type PersonalInfoInput = z.infer<typeof personalInfoSchema>

// Academic info schema (Step 2 of wizard)
export const academicInfoSchema = z.object({
  previousEducation: z
    .string()
    .max(500, "Previous education must be less than 500 characters")
    .optional(),
  
  workExperience: z
    .string()
    .max(1000, "Work experience must be less than 1000 characters")
    .optional(),
  
  source: z
    .string()
    .max(100, "Source must be less than 100 characters")
    .optional(),
  
  tags: z
    .array(z.string().max(50))
    .max(20, "Maximum 20 tags allowed")
    .optional(),
  
  createApplication: z.boolean().default(false),
  
  universityId: z
    .string()
    .uuid("Invalid university ID")
    .optional(),
  
  programId: z
    .string()
    .uuid("Invalid program ID")
    .optional(),
  
  intakeDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .optional(),
}).refine((data) => {
  // If createApplication is true, universityId, programId, and intakeDate are required
  if (data.createApplication) {
    return !!data.universityId && !!data.programId && !!data.intakeDate
  }
  return true
}, {
  message: "University, program, and intake date are required when creating an application",
  path: ["universityId"],
})

export type AcademicInfoInput = z.infer<typeof academicInfoSchema>

// Create student schema (complete)
export const createStudentSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters"),
  
  email: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .nullable(),
  
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(phoneRegex, "Please enter a valid phone number with country code"),
  
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .optional()
    .nullable(),
  
  gender: z
    .enum(["male", "female", "other", "prefer_not_to_say"])
    .optional()
    .nullable(),
  
  nationality: z
    .string()
    .max(100)
    .optional()
    .nullable(),
  
  address: z
    .string()
    .max(500)
    .optional()
    .nullable(),
  
  city: z
    .string()
    .max(100)
    .optional()
    .nullable(),
  
  state: z
    .string()
    .max(100)
    .optional()
    .nullable(),
  
  pincode: z
    .string()
    .max(20)
    .optional()
    .nullable(),
  
  country: z
    .string()
    .max(100)
    .optional()
    .nullable(),
  
  emergencyContactName: z
    .string()
    .max(100)
    .optional()
    .nullable(),
  
  emergencyContactPhone: z
    .string()
    .optional()
    .nullable(),
  
  previousEducation: z
    .string()
    .max(500)
    .optional()
    .nullable(),
  
  workExperience: z
    .string()
    .max(1000)
    .optional()
    .nullable(),
  
  source: z
    .string()
    .max(100)
    .optional()
    .nullable(),
  
  tags: z
    .array(z.string())
    .optional()
    .nullable(),
  
  status: z
    .enum(studentStatuses as [string, ...string[]])
    .default("lead"),
})

export type CreateStudentInput = z.infer<typeof createStudentSchema>

// Update student schema (all fields optional)
export const updateStudentSchema = createStudentSchema.partial()

export type UpdateStudentInput = z.infer<typeof updateStudentSchema>

// Student status update schema
export const updateStudentStatusSchema = z.object({
  status: z.enum(studentStatuses as [string, ...string[]]),
  reason: z
    .string()
    .min(1, "Reason is required for status change")
    .optional(),
}).refine((data) => {
  // Validate status transition
  // Note: This would need the current status to validate properly
  // The actual validation should happen in the API/service layer
  return true
}, {
  message: "Invalid status transition",
})

export type UpdateStudentStatusInput = z.infer<typeof updateStudentStatusSchema>

// Student filters schema
export const studentFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.array(z.string()).optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  freelancerId: z.string().uuid().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["created_at", "updated_at", "name", "status"]).default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

export type StudentFiltersInput = z.infer<typeof studentFiltersSchema>

// Bulk operations schema
export const bulkStudentUpdateSchema = z.object({
  ids: z
    .array(z.string().uuid())
    .min(1, "At least one student ID is required"),
  status: z.enum(studentStatuses as [string, ...string[]]).optional(),
  tags: z.array(z.string()).optional(),
})

export type BulkStudentUpdateInput = z.infer<typeof bulkStudentUpdateSchema>

// Duplicate check schema
export const duplicateCheckSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().regex(phoneRegex).optional(),
  excludeId: z.string().uuid().optional(),
}).refine((data) => {
  return data.email || data.phone
}, {
  message: "Either email or phone is required",
})

export type DuplicateCheckInput = z.infer<typeof duplicateCheckSchema>

// Validation helper functions
export function validateEmail(email: string): boolean {
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  return phoneRegex.test(phone)
}

export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")
  
  // If already has country code (starts with +)
  if (phone.startsWith("+")) {
    return phone
  }
  
  // If 10 digits, assume Indian number
  if (cleaned.length === 10) {
    return `+91${cleaned}`
  }
  
  // Otherwise, add + prefix
  return `+${cleaned}`
}

// Error message formatter
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {}
  
  error.errors.forEach((err) => {
    const path = err.path.join(".")
    formatted[path] = err.message
  })
  
  return formatted
}

// Validate status transition
export function validateStudentStatusTransition(
  from: StudentStatus,
  to: StudentStatus
): { valid: boolean; error?: string } {
  if (!canTransitionStudent(from, to)) {
    return {
      valid: false,
      error: `Cannot transition from "${from}" to "${to}"`,
    }
  }
  
  return { valid: true }
}
