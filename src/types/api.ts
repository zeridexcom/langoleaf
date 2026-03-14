import { Database } from './database'

// Base API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: ApiError
  meta?: ApiMeta
}

export interface ApiError {
  code: ErrorCode
  message: string
  details?: FieldError[]
}

export interface FieldError {
  field: string
  message: string
}

export interface ApiMeta {
  page: number
  perPage: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// Error Codes
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INVALID_STATUS_TRANSITION'
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILE_TYPE'
  | 'INTERNAL_ERROR'
  | 'RATE_LIMITED'
  | 'BAD_REQUEST'

// HTTP Status Codes mapping
export const ERROR_HTTP_STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INVALID_STATUS_TRANSITION: 422,
  FILE_TOO_LARGE: 400,
  INVALID_FILE_TYPE: 400,
  INTERNAL_ERROR: 500,
  RATE_LIMITED: 429,
  BAD_REQUEST: 400,
}

// Student API Types
export type Student = Database['public']['Tables']['students']['Row']
export type StudentInsert = Database['public']['Tables']['students']['Insert']
export type StudentUpdate = Database['public']['Tables']['students']['Update']

export interface StudentWithRelations extends Student {
  applications?: ApplicationWithRelations[]
  documents?: Document[]
  freelancer?: {
    id: string
    full_name: string
    email: string
  }
}

export interface StudentFilters {
  search?: string
  status?: string[]
  program?: string
  university?: string
  source?: string
  tags?: string[]
  dateFrom?: string
  dateTo?: string
  freelancerId?: string
}

export interface StudentSort {
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export interface PaginatedStudentsResponse {
  students: StudentWithRelations[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
  filters: {
    programs: string[]
    universities: string[]
    sources: string[]
    tags: string[]
  }
}

// Application API Types
export type Application = Database['public']['Tables']['applications']['Row']
export type ApplicationInsert = Database['public']['Tables']['applications']['Insert']
export type ApplicationUpdate = Database['public']['Tables']['applications']['Update']

export interface ApplicationWithRelations extends Application {
  student?: Student
  university?: {
    id: string
    name: string
    country: string
  }
  program?: {
    id: string
    name: string
    degree_type: string
  }
  documents?: ApplicationDocument[]
}

export interface ApplicationFilters {
  search?: string
  status?: string[]
  universityId?: string
  programId?: string
  studentId?: string
  dateFrom?: string
  dateTo?: string
}

export interface ApplicationSort {
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export interface PaginatedApplicationsResponse {
  applications: ApplicationWithRelations[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
  filters: {
    universities: string[]
    programs: string[]
    statuses: string[]
  }
}

export interface ApplicationStatusUpdate {
  status: string
  reason?: string
  metadata?: Record<string, unknown>
}

// Document API Types
export type Document = Database['public']['Tables']['student_documents']['Row']
export type DocumentInsert = Database['public']['Tables']['student_documents']['Insert']
export type DocumentUpdate = Database['public']['Tables']['student_documents']['Update']

export interface DocumentWithRelations extends Document {
  student?: Student
  uploadedBy?: {
    id: string
    full_name: string
  }
}

export interface ApplicationDocument {
  id: string
  application_id: string
  document_id: string | null
  doc_type: string
  is_required: boolean
  is_uploaded: boolean
  uploaded_at: string | null
  document?: Document
}

export interface DocumentUploadResponse {
  document: Document
  signedUrl?: string
  previewUrl?: string
}

export interface DocumentDownloadResponse {
  downloadUrl: string
  expiresAt: string
}

// University API Types
export type University = Database['public']['Tables']['universities']['Row']
export type UniversityInsert = Database['public']['Tables']['universities']['Insert']

export interface UniversityWithPrograms extends University {
  programs?: Program[]
}

export type Program = Database['public']['Tables']['programs']['Row']
export type ProgramInsert = Database['public']['Tables']['programs']['Insert']

// Dashboard API Types
export interface FreelancerDashboardStats {
  totalStudents: number
  totalApplications: number
  totalEarnings: number
  pendingApplications: number
  conversionRate: number
  recentStudents: StudentWithRelations[]
  recentApplications: ApplicationWithRelations[]
  earningsHistory: {
    month: string
    amount: number
  }[]
}

export interface AdminDashboardStats {
  totalStudents: number
  totalFreelancers: number
  totalApplications: number
  enrolledStudents: number
  totalRevenue: number
  recentStudents: StudentWithRelations[]
  recentApplications: ApplicationWithRelations[]
  topFreelancers: {
    freelancer_id: string
    full_name: string
    total_students: number
    total_applications: number
    total_earnings: number
  }[]
}

// Commission API Types
export type Commission = Database['public']['Tables']['commissions']['Row']
export type CommissionInsert = Database['public']['Tables']['commissions']['Insert']

// Activity Log Types
export type ActivityLog = Database['public']['Tables']['activity_log']['Row']

export interface ActivityLogWithUser extends ActivityLog {
  user?: {
    id: string
    full_name: string
  }
}

// Notification Types
export type Notification = Database['public']['Tables']['notifications']['Row']

// Status History Types
export type StatusHistory = Database['public']['Tables']['status_history']['Row']

export interface StatusHistoryWithUser extends StatusHistory {
  changedBy?: {
    id: string
    full_name: string
  }
}

// User/Profile Types
export type Profile = Database['public']['Tables']['profiles']['Row']

// Wizard Types
export interface WizardPersonalInfo {
  fullName: string
  email: string
  phone: string
  dateOfBirth?: string
  gender?: string
  nationality?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  country?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
}

export interface WizardAcademicInfo {
  previousEducation?: string
  workExperience?: string
  source?: string
  tags?: string[]
  createApplication: boolean
  universityId?: string
  programId?: string
  intakeDate?: string
}

export interface WizardDocumentInfo {
  documents: {
    type: string
    file: File
    expiryDate?: string
  }[]
}

export interface WizardState {
  step: number
  personalInfo: WizardPersonalInfo
  academicInfo: WizardAcademicInfo
  documents: WizardDocumentInfo
  isSubmitting: boolean
  error: string | null
}

// Bulk Operations
export interface BulkOperationResult {
  success: boolean
  processed: number
  failed: number
  errors: {
    id: string
    error: string
  }[]
}

// Export Types
export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf'
  fields: string[]
  filters?: StudentFilters
}

// Search Types
export interface SearchResult {
  type: 'student' | 'application' | 'document' | 'university'
  id: string
  title: string
  subtitle?: string
  url: string
}

// Filter Options
export interface FilterOptions {
  programs: string[]
  universities: string[]
  sources: string[]
  tags: string[]
  statuses: string[]
}
