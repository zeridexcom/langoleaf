import { DocumentStatus } from '@/types/database'

export const DOCUMENT_STATUS_CONFIG: Record<DocumentStatus, {
  label: string
  color: string
  bgColor: string
  icon: string
  description: string
}> = {
  uploaded: {
    label: 'Uploaded',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: 'Upload',
    description: 'Document uploaded, pending review',
  },
  under_review: {
    label: 'Under Review',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: 'Eye',
    description: 'Document is being reviewed',
  },
  approved: {
    label: 'Approved',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: 'CheckCircle',
    description: 'Document approved and valid',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: 'XCircle',
    description: 'Document rejected, needs replacement',
  },
  expired: {
    label: 'Expired',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: 'Clock',
    description: 'Document has expired',
  },
}

// Valid transitions for document status
export const VALID_DOCUMENT_TRANSITIONS: Array<{
  from: DocumentStatus;
  to: DocumentStatus;
  condition: string;
}> = [
  // From uploaded
  { from: 'uploaded', to: 'under_review', condition: 'Review started' },
  { from: 'uploaded', to: 'approved', condition: 'Auto-approved or quick review' },
  { from: 'uploaded', to: 'rejected', condition: 'Immediate rejection' },
  
  // From under_review
  { from: 'under_review', to: 'approved', condition: 'Document meets requirements' },
  { from: 'under_review', to: 'rejected', condition: 'Document does not meet requirements' },
  { from: 'under_review', to: 'uploaded', condition: 'Review cancelled' },
  
  // From approved
  { from: 'approved', to: 'expired', condition: 'Document past expiry date' },
  { from: 'approved', to: 'under_review', condition: 'Re-review required' },
  
  // From rejected
  { from: 'rejected', to: 'uploaded', condition: 'New version uploaded' },
  { from: 'rejected', to: 'under_review', condition: 'Reconsideration requested' },
  
  // From expired
  { from: 'expired', to: 'uploaded', condition: 'New version uploaded' },
]

export function canTransitionDocument(from: DocumentStatus, to: DocumentStatus): boolean {
  return VALID_DOCUMENT_TRANSITIONS.some(
    (transition) => transition.from === from && transition.to === to
  )
}

export function getNextDocumentStatuses(current: DocumentStatus): DocumentStatus[] {
  return VALID_DOCUMENT_TRANSITIONS
    .filter((transition) => transition.from === current)
    .map((transition) => transition.to)
}

export function validateDocumentTransition(
  from: DocumentStatus,
  to: DocumentStatus
): { valid: boolean; error?: string; allowedTransitions?: DocumentStatus[] } {
  if (!canTransitionDocument(from, to)) {
    const allowed = getNextDocumentStatuses(from)
    return {
      valid: false,
      error: `Invalid document transition from "${from}" to "${to}". Allowed transitions: ${allowed.join(', ') || 'none'}`,
      allowedTransitions: allowed,
    }
  }
  
  return { valid: true }
}

export function getDocumentStatusLabel(status: DocumentStatus): string {
  return DOCUMENT_STATUS_CONFIG[status]?.label || status
}

export function getDocumentStatusColor(status: DocumentStatus): string {
  return DOCUMENT_STATUS_CONFIG[status]?.color || 'text-gray-700'
}

export function getDocumentStatusBgColor(status: DocumentStatus): string {
  return DOCUMENT_STATUS_CONFIG[status]?.bgColor || 'bg-gray-100'
}

export function getDocumentStatusDescription(status: DocumentStatus): string {
  return DOCUMENT_STATUS_CONFIG[status]?.description || ''
}
