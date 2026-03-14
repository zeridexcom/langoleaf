import { DocumentType } from '@/types/database'

export interface DocumentTypeConfig {
  value: DocumentType
  label: string
  description: string
  isRequired: boolean
  allowedMimeTypes: string[]
  maxFileSize: number // in bytes
  requiresExpiry: boolean
  category: 'identity' | 'academic' | 'financial' | 'visa' | 'other'
}

export const DOCUMENT_TYPES: DocumentTypeConfig[] = [
  // Identity Documents
  {
    value: 'passport',
    label: 'Passport',
    description: 'Valid passport copy',
    isRequired: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    requiresExpiry: true,
    category: 'identity',
  },
  {
    value: 'national_id',
    label: 'National ID',
    description: 'Government-issued national ID card',
    isRequired: false,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
    maxFileSize: 10 * 1024 * 1024,
    requiresExpiry: true,
    category: 'identity',
  },
  {
    value: 'photo',
    label: 'Passport Photo',
    description: 'Recent passport-sized photograph',
    isRequired: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    requiresExpiry: false,
    category: 'identity',
  },
  
  // Academic Documents
  {
    value: 'academic_transcript',
    label: 'Academic Transcript',
    description: 'Official academic transcripts',
    isRequired: true,
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxFileSize: 10 * 1024 * 1024,
    requiresExpiry: false,
    category: 'academic',
  },
  {
    value: 'degree_certificate',
    label: 'Degree Certificate',
    description: 'Degree or diploma certificate',
    isRequired: true,
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxFileSize: 10 * 1024 * 1024,
    requiresExpiry: false,
    category: 'academic',
  },
  {
    value: 'marksheet',
    label: 'Marksheet',
    description: 'Examination marksheets',
    isRequired: false,
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxFileSize: 10 * 1024 * 1024,
    requiresExpiry: false,
    category: 'academic',
  },
  {
    value: 'recommendation_letter',
    label: 'Recommendation Letter',
    description: 'Letters of recommendation',
    isRequired: false,
    allowedMimeTypes: ['application/pdf'],
    maxFileSize: 5 * 1024 * 1024,
    requiresExpiry: false,
    category: 'academic',
  },
  {
    value: 'statement_of_purpose',
    label: 'Statement of Purpose',
    description: 'Personal statement or SOP',
    isRequired: false,
    allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxFileSize: 5 * 1024 * 1024,
    requiresExpiry: false,
    category: 'academic',
  },
  {
    value: 'cv_resume',
    label: 'CV/Resume',
    description: 'Curriculum vitae or resume',
    isRequired: false,
    allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxFileSize: 5 * 1024 * 1024,
    requiresExpiry: false,
    category: 'academic',
  },
  {
    value: 'language_test_score',
    label: 'Language Test Score',
    description: 'IELTS, TOEFL, or other language test results',
    isRequired: true,
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxFileSize: 5 * 1024 * 1024,
    requiresExpiry: true,
    category: 'academic',
  },
  
  // Financial Documents
  {
    value: 'financial_proof',
    label: 'Financial Proof',
    description: 'Proof of financial capability',
    isRequired: true,
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxFileSize: 10 * 1024 * 1024,
    requiresExpiry: false,
    category: 'financial',
  },
  {
    value: 'bank_statement',
    label: 'Bank Statement',
    description: 'Recent bank statements',
    isRequired: false,
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxFileSize: 10 * 1024 * 1024,
    requiresExpiry: true,
    category: 'financial',
  },
  {
    value: 'sponsorship_letter',
    label: 'Sponsorship Letter',
    description: 'Letter from sponsor',
    isRequired: false,
    allowedMimeTypes: ['application/pdf'],
    maxFileSize: 5 * 1024 * 1024,
    requiresExpiry: false,
    category: 'financial',
  },
  
  // Visa Documents
  {
    value: 'visa_document',
    label: 'Visa Document',
    description: 'Visa application or approval documents',
    isRequired: false,
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxFileSize: 10 * 1024 * 1024,
    requiresExpiry: true,
    category: 'visa',
  },
  {
    value: 'medical_report',
    label: 'Medical Report',
    description: 'Health and medical examination report',
    isRequired: false,
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxFileSize: 10 * 1024 * 1024,
    requiresExpiry: true,
    category: 'visa',
  },
  {
    value: 'police_clearance',
    label: 'Police Clearance',
    description: 'Police clearance certificate',
    isRequired: false,
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxFileSize: 10 * 1024 * 1024,
    requiresExpiry: true,
    category: 'visa',
  },
  
  // Other Documents
  {
    value: 'admission_letter',
    label: 'Admission Letter',
    description: 'University admission or offer letter',
    isRequired: false,
    allowedMimeTypes: ['application/pdf'],
    maxFileSize: 5 * 1024 * 1024,
    requiresExpiry: false,
    category: 'other',
  },
  {
    value: 'scholarship_letter',
    label: 'Scholarship Letter',
    description: 'Scholarship award letter',
    isRequired: false,
    allowedMimeTypes: ['application/pdf'],
    maxFileSize: 5 * 1024 * 1024,
    requiresExpiry: false,
    category: 'other',
  },
  {
    value: 'other',
    label: 'Other Document',
    description: 'Any other relevant document',
    isRequired: false,
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxFileSize: 10 * 1024 * 1024,
    requiresExpiry: false,
    category: 'other',
  },
]

export const DOCUMENT_CATEGORIES = {
  identity: 'Identity Documents',
  academic: 'Academic Documents',
  financial: 'Financial Documents',
  visa: 'Visa Documents',
  other: 'Other Documents',
} as const

export function getDocumentTypeConfig(type: DocumentType): DocumentTypeConfig | undefined {
  return DOCUMENT_TYPES.find((doc) => doc.value === type)
}

export function getRequiredDocuments(): DocumentTypeConfig[] {
  return DOCUMENT_TYPES.filter((doc) => doc.isRequired)
}

export function getDocumentsByCategory(category: keyof typeof DOCUMENT_CATEGORIES): DocumentTypeConfig[] {
  return DOCUMENT_TYPES.filter((doc) => doc.category === category)
}

export function isValidDocumentType(type: string): type is DocumentType {
  return DOCUMENT_TYPES.some((doc) => doc.value === type)
}

export function getAllowedMimeTypes(type: DocumentType): string[] {
  return getDocumentTypeConfig(type)?.allowedMimeTypes || ['application/pdf']
}

export function getMaxFileSize(type: DocumentType): number {
  return getDocumentTypeConfig(type)?.maxFileSize || 10 * 1024 * 1024 // Default 10MB
}

export function requiresExpiryDate(type: DocumentType): boolean {
  return getDocumentTypeConfig(type)?.requiresExpiry || false
}
