import { z } from 'zod'
import { ApplicationStatus } from '@/types/database'
import { canTransition } from '@/lib/state-machines/application-status'

// Application creation schema
export const createApplicationSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  universityId: z.string().uuid('Invalid university ID'),
  programId: z.string().uuid('Invalid program ID'),
  intakeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
})

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>

// Application update schema
export const updateApplicationSchema = z.object({
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  applicationFeePaid: z.boolean().optional(),
  applicationFeeAmount: z.number().min(0).optional().nullable(),
  commissionAmount: z.number().min(0).optional().nullable(),
})

export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>

// Application status update schema
export const updateApplicationStatusSchema = z.object({
  status: z.enum([
    'draft',
    'documents_pending',
    'ready_to_submit',
    'submitted',
    'under_review',
    'additional_info_needed',
    'conditional_offer',
    'unconditional_offer',
    'offer_accepted',
    'offer_declined',
    'visa_processing',
    'enrolled',
    'rejected',
    'withdrawn',
    'deferred',
  ] as const),
  reason: z.string().min(1, 'Reason is required for this status change').optional(),
  metadata: z.record(z.unknown()).optional(),
}).refine((data) => {
  // If transitioning to a status that requires reason, ensure reason is provided
  const statusesRequiringReason: ApplicationStatus[] = [
    'rejected',
    'withdrawn',
    'offer_declined',
    'additional_info_needed',
    'deferred',
  ]
  
  if (statusesRequiringReason.includes(data.status as ApplicationStatus) && !data.reason) {
    return false
  }
  
  return true
}, {
  message: 'Reason is required for this status transition',
  path: ['reason'],
})

export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>

// Validate status transition
export function validateStatusTransition(
  currentStatus: ApplicationStatus,
  newStatus: ApplicationStatus
): { valid: boolean; error?: string } {
  if (!canTransition(currentStatus, newStatus)) {
    return {
      valid: false,
      error: `Cannot transition from "${currentStatus}" to "${newStatus}"`,
    }
  }
  
  return { valid: true }
}

// Application filters schema
export const applicationFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.array(z.string()).optional(),
  universityId: z.string().uuid().optional(),
  programId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['created_at', 'updated_at', 'status', 'intake_date']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type ApplicationFiltersInput = z.infer<typeof applicationFiltersSchema>

// Bulk operations schema
export const bulkApplicationUpdateSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one application ID is required'),
  status: z.enum([
    'draft',
    'documents_pending',
    'ready_to_submit',
    'submitted',
    'under_review',
    'additional_info_needed',
    'conditional_offer',
    'unconditional_offer',
    'offer_accepted',
    'offer_declined',
    'visa_processing',
    'enrolled',
    'rejected',
    'withdrawn',
    'deferred',
  ] as const).optional(),
  notes: z.string().optional(),
})

export type BulkApplicationUpdateInput = z.infer<typeof bulkApplicationUpdateSchema>

// Application document link schema
export const linkApplicationDocumentSchema = z.object({
  documentId: z.string().uuid('Invalid document ID'),
  docType: z.string().min(1, 'Document type is required'),
  isRequired: z.boolean().default(false),
})

export type LinkApplicationDocumentInput = z.infer<typeof linkApplicationDocumentSchema>

// Commission update schema
export const updateCommissionSchema = z.object({
  amount: z.number().min(0, 'Commission amount must be positive'),
  status: z.enum([
    'not_applicable',
    'pending',
    'approved',
    'invoiced',
    'paid',
    'disputed',
  ] as const).optional(),
  invoiceNumber: z.string().optional().nullable(),
  paidAt: z.string().datetime().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

export type UpdateCommissionInput = z.infer<typeof updateCommissionSchema>
