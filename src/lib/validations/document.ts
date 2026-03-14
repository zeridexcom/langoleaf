import { z } from 'zod'
import { DocumentType, DocumentStatus } from '@/types/database'
import { DOCUMENT_TYPES, getMaxFileSize, getAllowedMimeTypes } from '@/lib/constants/document-types'

// Document types for validation
const documentTypes: DocumentType[] = [
  'passport',
  'national_id',
  'photo',
  'academic_transcript',
  'degree_certificate',
  'marksheet',
  'recommendation_letter',
  'statement_of_purpose',
  'cv_resume',
  'language_test_score',
  'financial_proof',
  'bank_statement',
  'sponsorship_letter',
  'medical_report',
  'police_clearance',
  'visa_document',
  'admission_letter',
  'scholarship_letter',
  'other',
]

// Document upload schema
export const uploadDocumentSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  docType: z.enum(documentTypes as [string, ...string[]], {
    errorMap: () => ({ message: 'Invalid document type' }),
  }),
  customLabel: z.string().max(100).optional(),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(500).optional(),
}).refine((data) => {
  // If docType is 'other', customLabel is required
  if (data.docType === 'other' && !data.customLabel) {
    return false
  }
  return true
}, {
  message: 'Custom label is required when document type is "other"',
  path: ['customLabel'],
}).refine((data) => {
  // Check if expiry date is required for this document type
  const docConfig = DOCUMENT_TYPES.find(d => d.value === data.docType)
  if (docConfig?.requiresExpiry && !data.expiryDate) {
    return false
  }
  return true
}, {
  message: 'Expiry date is required for this document type',
  path: ['expiryDate'],
})

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>

// File validation schema
export const fileValidationSchema = z.object({
  file: z.instanceof(File).refine((file) => {
    // Check file size
    const maxSize = 10 * 1024 * 1024 // 10MB default
    return file.size > 0 && file.size <= maxSize
  }, {
    message: 'File size must be between 0 and 10MB',
  }).refine((file) => {
    // Check file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    return allowedTypes.includes(file.type)
  }, {
    message: 'Invalid file type. Allowed: PDF, JPEG, PNG, DOC, DOCX',
  }),
})

export type FileValidationInput = z.infer<typeof fileValidationSchema>

// Document update schema
export const updateDocumentSchema = z.object({
  status: z.enum([
    'uploaded',
    'under_review',
    'approved',
    'rejected',
    'expired',
  ] as const).optional(),
  rejectionReason: z.string().max(500).optional(),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(500).optional(),
}).refine((data) => {
  // If status is rejected, rejection reason is required
  if (data.status === 'rejected' && !data.rejectionReason) {
    return false
  }
  return true
}, {
  message: 'Rejection reason is required when status is rejected',
  path: ['rejectionReason'],
})

export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>

// Document status update schema
export const updateDocumentStatusSchema = z.object({
  status: z.enum([
    'uploaded',
    'under_review',
    'approved',
    'rejected',
    'expired',
  ] as const),
  reason: z.string().min(1).optional(),
})

export type UpdateDocumentStatusInput = z.infer<typeof updateDocumentStatusSchema>

// Document filters schema
export const documentFiltersSchema = z.object({
  studentId: z.string().uuid().optional(),
  docType: z.string().optional(),
  status: z.enum([
    'uploaded',
    'under_review',
    'approved',
    'rejected',
    'expired',
  ] as const).optional(),
  isLatest: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['created_at', 'doc_type', 'status']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type DocumentFiltersInput = z.infer<typeof documentFiltersSchema>

// Validate file for specific document type
export function validateFileForDocumentType(
  file: File,
  docType: DocumentType
): { valid: boolean; error?: string } {
  const config = DOCUMENT_TYPES.find(d => d.value === docType)
  
  if (!config) {
    return { valid: false, error: 'Invalid document type' }
  }
  
  // Check file size
  if (file.size > config.maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed (${config.maxFileSize / (1024 * 1024)}MB)`,
    }
  }
  
  // Check MIME type
  if (!config.allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${config.allowedMimeTypes.join(', ')}`,
    }
  }
  
  return { valid: true }
}

// Bulk document operations schema
export const bulkDocumentUpdateSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one document ID is required'),
  status: z.enum([
    'uploaded',
    'under_review',
    'approved',
    'rejected',
    'expired',
  ] as const),
  reason: z.string().optional(),
})

export type BulkDocumentUpdateInput = z.infer<typeof bulkDocumentUpdateSchema>

// Document replacement schema
export const replaceDocumentSchema = z.object({
  documentId: z.string().uuid('Invalid document ID'),
  file: z.instanceof(File),
  notes: z.string().max(500).optional(),
})

export type ReplaceDocumentInput = z.infer<typeof replaceDocumentSchema>
