import { DocumentType } from '@/types/database'
import { getAllowedMimeTypes, getMaxFileSize, getDocumentTypeConfig } from '@/lib/constants/document-types'

export interface FileValidationResult {
  valid: boolean
  error?: string
}

export function validateFileType(file: File, allowedTypes: string[]): FileValidationResult {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
    }
  }
  
  return { valid: true }
}

export function validateFileSize(file: File, maxSize: number): FileValidationResult {
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed (${formatFileSize(maxSize)})`,
    }
  }
  
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File cannot be empty',
    }
  }
  
  return { valid: true }
}

export function validateFile(file: File, docType: DocumentType): FileValidationResult {
  const config = getDocumentTypeConfig(docType)
  
  if (!config) {
    return { valid: false, error: 'Invalid document type' }
  }
  
  // Validate file type
  const typeValidation = validateFileType(file, config.allowedMimeTypes)
  if (!typeValidation.valid) {
    return typeValidation
  }
  
  // Validate file size
  const sizeValidation = validateFileSize(file, config.maxFileSize)
  if (!sizeValidation.valid) {
    return sizeValidation
  }
  
  return { valid: true }
}

export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase()
}

export function sanitizeFilename(filename: string): string {
  // Remove special characters and spaces
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase()
}

export function generateUniqueFilename(originalName: string, prefix?: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = getFileExtension(originalName)
  const baseName = originalName.replace(/\.[^/.]+$/, '')
  const sanitized = sanitizeFilename(baseName)
  
  if (prefix) {
    return `${prefix}_${timestamp}_${random}.${extension}`
  }
  
  return `${sanitized}_${timestamp}_${random}.${extension}`
}

export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

export function isPdfFile(mimeType: string): boolean {
  return mimeType === 'application/pdf'
}

export function getMimeTypeFromExtension(extension: string): string {
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
  }
  
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream'
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

export function base64ToFile(base64: string, filename: string): File {
  const arr = base64.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || ''
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  
  return new File([u8arr], filename, { type: mime })
}

export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function createFilePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isImageFile(file.type)) {
      reject(new Error('File is not an image'))
      return
    }
    
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

export function getFileIcon(mimeType: string): string {
  if (isImageFile(mimeType)) return 'image'
  if (isPdfFile(mimeType)) return 'pdf'
  if (mimeType.includes('word')) return 'word'
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'excel'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'powerpoint'
  if (mimeType.includes('text')) return 'text'
  return 'file'
}

export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

export async function processFilesInBatches<T>(
  files: File[],
  batchSize: number,
  processor: (file: File) => Promise<T>
): Promise<T[]> {
  const chunks = chunkArray(files, batchSize)
  const results: T[] = []
  
  for (const chunk of chunks) {
    const batchResults = await Promise.all(chunk.map(processor))
    results.push(...batchResults)
  }
  
  return results
}
