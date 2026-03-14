import { StudentStatus } from '@/types/database'

export const STUDENT_STATUS_CONFIG: Record<StudentStatus, {
  label: string
  color: string
  bgColor: string
  icon: string
  description: string
  isTerminal: boolean
}> = {
  lead: {
    label: 'Lead',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: 'UserPlus',
    description: 'Potential student, not yet active',
    isTerminal: false,
  },
  active: {
    label: 'Active',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: 'UserCheck',
    description: 'Active student with ongoing applications',
    isTerminal: false,
  },
  inactive: {
    label: 'Inactive',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: 'UserX',
    description: 'Student temporarily inactive',
    isTerminal: false,
  },
  enrolled: {
    label: 'Enrolled',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    icon: 'GraduationCap',
    description: 'Student successfully enrolled at university',
    isTerminal: true,
  },
  archived: {
    label: 'Archived',
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
    icon: 'Archive',
    description: 'Student record archived',
    isTerminal: true,
  },
}

// Valid transitions for student status
export const VALID_STUDENT_TRANSITIONS: Array<{
  from: StudentStatus;
  to: StudentStatus;
  condition: string;
}> = [
  // From lead
  { from: 'lead', to: 'active', condition: 'Student starts application process' },
  { from: 'lead', to: 'inactive', condition: 'Lead goes cold' },
  { from: 'lead', to: 'archived', condition: 'Lead is not interested' },
  
  // From active
  { from: 'active', to: 'enrolled', condition: 'Student enrolls at university' },
  { from: 'active', to: 'inactive', condition: 'Student pauses applications' },
  { from: 'active', to: 'archived', condition: 'Student withdraws completely' },
  
  // From inactive
  { from: 'inactive', to: 'active', condition: 'Student resumes applications' },
  { from: 'inactive', to: 'enrolled', condition: 'Student enrolls' },
  { from: 'inactive', to: 'archived', condition: 'Student no longer interested' },
  
  // From enrolled (terminal, but can be archived)
  { from: 'enrolled', to: 'archived', condition: 'Student record archived after enrollment' },
  
  // From archived (can be reactivated)
  { from: 'archived', to: 'lead', condition: 'Archived lead reactivated' },
  { from: 'archived', to: 'active', condition: 'Archived student becomes active again' },
]

export function canTransitionStudent(from: StudentStatus, to: StudentStatus): boolean {
  if (isStudentTerminal(from) && from !== 'archived') {
    return false
  }
  
  return VALID_STUDENT_TRANSITIONS.some(
    (transition) => transition.from === from && transition.to === to
  )
}

export function getNextStudentStatuses(current: StudentStatus): StudentStatus[] {
  if (isStudentTerminal(current) && current !== 'archived') {
    return []
  }
  
  return VALID_STUDENT_TRANSITIONS
    .filter((transition) => transition.from === current)
    .map((transition) => transition.to)
}

export function isStudentTerminal(status: StudentStatus): boolean {
  return STUDENT_STATUS_CONFIG[status]?.isTerminal ?? false
}

export function validateStudentTransition(
  from: StudentStatus,
  to: StudentStatus
): { valid: boolean; error?: string; allowedTransitions?: StudentStatus[] } {
  if (isStudentTerminal(from) && from !== 'archived') {
    return {
      valid: false,
      error: `Cannot transition from terminal status "${from}"`,
      allowedTransitions: [],
    }
  }
  
  if (!canTransitionStudent(from, to)) {
    const allowed = getNextStudentStatuses(from)
    return {
      valid: false,
      error: `Invalid transition from "${from}" to "${to}". Allowed transitions: ${allowed.join(', ') || 'none'}`,
      allowedTransitions: allowed,
    }
  }
  
  return { valid: true }
}

export function getStudentStatusLabel(status: StudentStatus): string {
  return STUDENT_STATUS_CONFIG[status]?.label || status
}

export function getStudentStatusColor(status: StudentStatus): string {
  return STUDENT_STATUS_CONFIG[status]?.color || 'text-gray-700'
}

export function getStudentStatusBgColor(status: StudentStatus): string {
  return STUDENT_STATUS_CONFIG[status]?.bgColor || 'bg-gray-100'
}

export function getStudentStatusDescription(status: StudentStatus): string {
  return STUDENT_STATUS_CONFIG[status]?.description || ''
}
