import { ApplicationStatus } from '@/types/database'

export interface StatusTransition {
  from: ApplicationStatus
  to: ApplicationStatus
  condition?: string
}

export const APPLICATION_STATUS_CONFIG: Record<ApplicationStatus, {
  label: string
  color: string
  bgColor: string
  icon: string
  description: string
  isTerminal: boolean
  requiresReason: boolean
}> = {
  draft: {
    label: 'Draft',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: 'FileText',
    description: 'Application is being prepared',
    isTerminal: false,
    requiresReason: false,
  },
  documents_pending: {
    label: 'Documents Pending',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: 'FileWarning',
    description: 'Waiting for required documents',
    isTerminal: false,
    requiresReason: false,
  },
  ready_to_submit: {
    label: 'Ready to Submit',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: 'CheckCircle',
    description: 'All documents ready for submission',
    isTerminal: false,
    requiresReason: false,
  },
  submitted: {
    label: 'Submitted',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: 'Send',
    description: 'Application submitted to university',
    isTerminal: false,
    requiresReason: false,
  },
  under_review: {
    label: 'Under Review',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    icon: 'Eye',
    description: 'University is reviewing application',
    isTerminal: false,
    requiresReason: false,
  },
  additional_info_needed: {
    label: 'Additional Info Needed',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    icon: 'AlertCircle',
    description: 'University requested more information',
    isTerminal: false,
    requiresReason: true,
  },
  conditional_offer: {
    label: 'Conditional Offer',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-100',
    icon: 'FileCheck',
    description: 'Conditional admission offer received',
    isTerminal: false,
    requiresReason: false,
  },
  unconditional_offer: {
    label: 'Unconditional Offer',
    color: 'text-teal-700',
    bgColor: 'bg-teal-100',
    icon: 'Award',
    description: 'Unconditional admission offer received',
    isTerminal: false,
    requiresReason: false,
  },
  offer_accepted: {
    label: 'Offer Accepted',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    icon: 'ThumbsUp',
    description: 'Student accepted the offer',
    isTerminal: false,
    requiresReason: false,
  },
  offer_declined: {
    label: 'Offer Declined',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: 'ThumbsDown',
    description: 'Student declined the offer',
    isTerminal: true,
    requiresReason: true,
  },
  visa_processing: {
    label: 'Visa Processing',
    color: 'text-violet-700',
    bgColor: 'bg-violet-100',
    icon: 'Plane',
    description: 'Visa application in progress',
    isTerminal: false,
    requiresReason: false,
  },
  enrolled: {
    label: 'Enrolled',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: 'GraduationCap',
    description: 'Student successfully enrolled',
    isTerminal: true,
    requiresReason: false,
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: 'XCircle',
    description: 'Application was rejected',
    isTerminal: true,
    requiresReason: true,
  },
  withdrawn: {
    label: 'Withdrawn',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: 'LogOut',
    description: 'Application withdrawn by student',
    isTerminal: true,
    requiresReason: true,
  },
  deferred: {
    label: 'Deferred',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    icon: 'Clock',
    description: 'Application deferred to next intake',
    isTerminal: false,
    requiresReason: true,
  },
}

// Valid transitions according to the state machine
export const VALID_TRANSITIONS: StatusTransition[] = [
  // From draft
  { from: 'draft', to: 'documents_pending', condition: 'Student created, no documents' },
  { from: 'draft', to: 'ready_to_submit', condition: 'All documents uploaded' },
  { from: 'draft', to: 'withdrawn', condition: 'Student withdraws application' },
  
  // From documents_pending
  { from: 'documents_pending', to: 'ready_to_submit', condition: 'All required documents uploaded' },
  { from: 'documents_pending', to: 'draft', condition: 'Documents removed' },
  { from: 'documents_pending', to: 'withdrawn', condition: 'Student withdraws application' },
  
  // From ready_to_submit
  { from: 'ready_to_submit', to: 'submitted', condition: 'User submits application' },
  { from: 'ready_to_submit', to: 'documents_pending', condition: 'Documents removed' },
  { from: 'ready_to_submit', to: 'withdrawn', condition: 'Student withdraws application' },
  
  // From submitted
  { from: 'submitted', to: 'under_review', condition: 'University acknowledges receipt' },
  { from: 'submitted', to: 'additional_info_needed', condition: 'University requests more info' },
  { from: 'submitted', to: 'rejected', condition: 'University rejects application' },
  { from: 'submitted', to: 'withdrawn', condition: 'Student withdraws application' },
  
  // From under_review
  { from: 'under_review', to: 'conditional_offer', condition: 'Conditional offer made' },
  { from: 'under_review', to: 'unconditional_offer', condition: 'Unconditional offer made' },
  { from: 'under_review', to: 'additional_info_needed', condition: 'University requests more info' },
  { from: 'under_review', to: 'rejected', condition: 'University rejects application' },
  { from: 'under_review', to: 'withdrawn', condition: 'Student withdraws application' },
  
  // From additional_info_needed
  { from: 'additional_info_needed', to: 'under_review', condition: 'Additional info provided' },
  { from: 'additional_info_needed', to: 'submitted', condition: 'Info provided, back to review' },
  { from: 'additional_info_needed', to: 'withdrawn', condition: 'Student withdraws application' },
  
  // From conditional_offer
  { from: 'conditional_offer', to: 'unconditional_offer', condition: 'Conditions met' },
  { from: 'conditional_offer', to: 'offer_accepted', condition: 'Student accepts offer' },
  { from: 'conditional_offer', to: 'offer_declined', condition: 'Student declines offer' },
  { from: 'conditional_offer', to: 'withdrawn', condition: 'Student withdraws application' },
  
  // From unconditional_offer
  { from: 'unconditional_offer', to: 'offer_accepted', condition: 'Student accepts offer' },
  { from: 'unconditional_offer', to: 'offer_declined', condition: 'Student declines offer' },
  { from: 'unconditional_offer', to: 'withdrawn', condition: 'Student withdraws application' },
  
  // From offer_accepted
  { from: 'offer_accepted', to: 'visa_processing', condition: 'Visa application started' },
  { from: 'offer_accepted', to: 'enrolled', condition: 'Student enrolls' },
  { from: 'offer_accepted', to: 'withdrawn', condition: 'Student withdraws' },
  
  // From visa_processing
  { from: 'visa_processing', to: 'enrolled', condition: 'Visa approved, student enrolls' },
  { from: 'visa_processing', to: 'withdrawn', condition: 'Student withdraws' },
  
  // From rejected
  { from: 'rejected', to: 'deferred', condition: 'Application deferred to next intake' },
  
  // From withdrawn
  { from: 'withdrawn', to: 'draft', condition: 'Application reopened' },
  
  // From deferred
  { from: 'deferred', to: 'draft', condition: 'Application reactivated' },
  { from: 'deferred', to: 'submitted', condition: 'Resubmitted for new intake' },
]

export function canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  // Cannot transition from terminal states (except withdrawn can be reopened)
  if (isTerminal(from) && from !== 'withdrawn') {
    return false
  }
  
  return VALID_TRANSITIONS.some(
    (transition) => transition.from === from && transition.to === to
  )
}

export function getNextStatuses(current: ApplicationStatus): ApplicationStatus[] {
  if (isTerminal(current) && current !== 'withdrawn') {
    return []
  }
  
  return VALID_TRANSITIONS
    .filter((transition) => transition.from === current)
    .map((transition) => transition.to)
}

export function isTerminal(status: ApplicationStatus): boolean {
  return APPLICATION_STATUS_CONFIG[status]?.isTerminal ?? false
}

export function requiresReason(status: ApplicationStatus): boolean {
  return APPLICATION_STATUS_CONFIG[status]?.requiresReason ?? false
}

export function validateTransition(
  from: ApplicationStatus,
  to: ApplicationStatus
): { valid: boolean; error?: string; allowedTransitions?: ApplicationStatus[] } {
  if (isTerminal(from) && from !== 'withdrawn') {
    return {
      valid: false,
      error: `Cannot transition from terminal status "${from}"`,
      allowedTransitions: [],
    }
  }
  
  if (!canTransition(from, to)) {
    const allowed = getNextStatuses(from)
    return {
      valid: false,
      error: `Invalid transition from "${from}" to "${to}". Allowed transitions: ${allowed.join(', ') || 'none'}`,
      allowedTransitions: allowed,
    }
  }
  
  return { valid: true }
}

export function getStatusLabel(status: ApplicationStatus): string {
  return APPLICATION_STATUS_CONFIG[status]?.label || status
}

export function getStatusColor(status: ApplicationStatus): string {
  return APPLICATION_STATUS_CONFIG[status]?.color || 'text-gray-700'
}

export function getStatusBgColor(status: ApplicationStatus): string {
  return APPLICATION_STATUS_CONFIG[status]?.bgColor || 'bg-gray-100'
}

export function getStatusDescription(status: ApplicationStatus): string {
  return APPLICATION_STATUS_CONFIG[status]?.description || ''
}
