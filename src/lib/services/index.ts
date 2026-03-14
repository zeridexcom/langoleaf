// Service Layer Exports
// Phase 2: Service Layer + API Routes

export { CloudinaryService } from './cloudinary-service'
export { StudentService } from './student-service'
export { ApplicationService } from './application-service'
export { DocumentService } from './document-service'

// Phase 7: Notifications
export * from './notification-service'

// Phase 8: Reporting & Analytics
export * from './reporting-service'

// Phase 9: Gamification & Engagement
export * from './gamification-service'

// Re-export types for convenience
export type { CloudinaryUploadResult, CloudinaryUploadOptions } from './cloudinary-service'
