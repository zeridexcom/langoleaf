import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'

// Date formatting
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A'
  
  const parsed = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(parsed)) return 'Invalid date'
  
  return format(parsed, 'MMM d, yyyy')
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A'
  
  const parsed = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(parsed)) return 'Invalid date'
  
  return format(parsed, 'MMM d, yyyy h:mm a')
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A'
  
  const parsed = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(parsed)) return 'Invalid date'
  
  return formatDistanceToNow(parsed, { addSuffix: true })
}

export function formatDateForInput(date: string | Date | null | undefined): string {
  if (!date) return ''
  
  const parsed = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(parsed)) return ''
  
  return format(parsed, 'yyyy-MM-dd')
}

// Currency formatting
export function formatCurrency(
  amount: number | null | undefined,
  currency: string = 'USD'
): string {
  if (amount === null || amount === undefined) return 'N/A'
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatCompactNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0'
  
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(num)
}

// Phone formatting
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return 'N/A'
  
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  // If starts with +1 (US/Canada)
  if (cleaned.startsWith('+1') && cleaned.length === 12) {
    return `+1 (${cleaned.slice(2, 5)}) ${cleaned.slice(5, 8)}-${cleaned.slice(8)}`
  }
  
  // If starts with +91 (India)
  if (cleaned.startsWith('+91') && cleaned.length === 13) {
    return `+91 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)} ${cleaned.slice(10)}`
  }
  
  // If starts with +44 (UK)
  if (cleaned.startsWith('+44') && cleaned.length === 13) {
    return `+44 ${cleaned.slice(3, 7)} ${cleaned.slice(7, 11)} ${cleaned.slice(11)}`
  }
  
  // Default: just return as is
  return cleaned
}

// File size formatting
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return 'N/A'
  
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

// Name formatting
export function formatName(name: string | null | undefined): string {
  if (!name) return 'Unknown'
  
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

// Status formatting
export function formatStatus(status: string | null | undefined): string {
  if (!status) return 'Unknown'
  
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Truncate text
export function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  
  return text.slice(0, maxLength).trim() + '...'
}

// Array formatting
export function formatList(items: string[] | null | undefined, separator: string = ', '): string {
  if (!items || items.length === 0) return 'None'
  
  return items.join(separator)
}

// Percentage formatting
export function formatPercentage(value: number | null | undefined, decimals: number = 1): string {
  if (value === null || value === undefined) return '0%'
  
  return `${value.toFixed(decimals)}%`
}

// ID formatting (shorten UUIDs for display)
export function formatId(id: string | null | undefined): string {
  if (!id) return 'N/A'
  
  if (id.length > 8) {
    return `${id.slice(0, 4)}...${id.slice(-4)}`
  }
  
  return id
}

// Address formatting
export function formatAddress(
  address: string | null | undefined,
  city: string | null | undefined,
  state: string | null | undefined,
  pincode: string | null | undefined,
  country: string | null | undefined
): string {
  const parts = [address, city, state, pincode, country].filter(Boolean)
  
  if (parts.length === 0) return 'No address provided'
  
  return parts.join(', ')
}

// Age calculation
export function calculateAge(dateOfBirth: string | Date | null | undefined): number | null {
  if (!dateOfBirth) return null
  
  const dob = typeof dateOfBirth === 'string' ? parseISO(dateOfBirth) : dateOfBirth
  if (!isValid(dob)) return null
  
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--
  }
  
  return age
}

// Duration formatting
export function formatDuration(months: number | null | undefined): string {
  if (months === null || months === undefined) return 'N/A'
  
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  
  if (years === 0) {
    return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`
  }
  
  if (remainingMonths === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`
  }
  
  return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`
}

// Word count
export function countWords(text: string | null | undefined): number {
  if (!text) return 0
  
  return text.trim().split(/\s+/).filter(word => word.length > 0).length
}

// Slug generation
export function generateSlug(text: string | null | undefined): string {
  if (!text) return ''
  
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50)
}

// Capitalize first letter
export function capitalizeFirst(text: string | null | undefined): string {
  if (!text) return ''
  
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// Format tags
export function formatTags(tags: string[] | null | undefined): string {
  if (!tags || tags.length === 0) return 'No tags'
  
  return tags.map(tag => `#${tag}`).join(' ')
}
