import { createClient } from '@/lib/supabase/server'
import { AppError, Errors } from '@/lib/utils/error'
import { CloudinaryService } from './cloudinary-service'
import { validateFile } from '@/lib/utils/file'
import type { 
  Document, 
  DocumentInsert, 
  DocumentUpdate,
  DocumentWithRelations
} from '@/types/api'
import type { DocumentType, DocumentStatus } from '@/types/database'

interface DocumentFilters {
  docType?: DocumentType
  status?: DocumentStatus
}

export class DocumentService {
  /**
   * Upload a new document for a student
   */
  static async uploadDocument(
    freelancerId: string,
    data: {
      studentId: string
      docType: DocumentType
      file: Buffer
      filename: string
      mimeType: string
      expiryDate?: string
      notes?: string
    }
  ): Promise<Document> {
    const supabase = createClient()

    try {
      // Verify student belongs to freelancer
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('id', data.studentId)
        .eq('freelancer_id', freelancerId)
        .is('deleted_at', null)
        .single()

      if (studentError || !student) {
        throw Errors.notFound('Student not found or access denied')
      }

      // Validate file
      const validation = validateFile(
        { size: data.file.length, type: data.mimeType } as File,
        data.docType
      )
      if (!validation.valid) {
        throw new AppError('VALIDATION_ERROR', validation.error || 'Invalid file')
      }

      // Upload to Cloudinary
      const folder = `student-portal/${freelancerId}/${data.studentId}/documents`
      const uploadResult = await CloudinaryService.uploadFile(data.file, data.filename, {
        folder,
        tags: ['document', data.docType],
        context: {
          student_id: data.studentId,
          freelancer_id: freelancerId,
          doc_type: data.docType,
        },
      })

      // Create document record
      const { data: document, error: docError } = await supabase
        .from('student_documents')
        .insert({
          student_id: data.studentId,
          doc_type: data.docType,
          file_name: data.filename,
          file_url: uploadResult.secure_url,
          file_size: data.file.length,
          mime_type: data.mimeType,
          cloudinary_public_id: uploadResult.public_id,
          cloudinary_resource_type: uploadResult.resource_type,
          cloudinary_format: uploadResult.format,
          cloudinary_version: uploadResult.version,
          cloudinary_asset_id: uploadResult.asset_id,
          expiry_date: data.expiryDate || null,
          notes: data.notes || null,
          uploaded_by: freelancerId,
          status: 'uploaded' as DocumentStatus,
        })
        .select()
        .single()

      if (docError) {
        // Clean up Cloudinary file
        await CloudinaryService.deleteFile(uploadResult.public_id)
        throw new AppError('INTERNAL_ERROR', 'Failed to create document record')
      }

      return document
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('INTERNAL_ERROR', 'Failed to upload document')
    }
  }

  /**
   * Get a single document by ID
   */
  static async getDocumentById(
    id: string,
    freelancerId?: string
  ): Promise<DocumentWithRelations> {
    const supabase = createClient()

    let query = supabase
      .from('student_documents')
      .select(`
        *,
        student:students(*),
        uploaded_by_user:profiles!uploaded_by(id, full_name, email)
      `)
      .eq('id', id)
      .is('deleted_at', null)

    if (freelancerId) {
      query = query.eq('student.freelancer_id', freelancerId)
    }

    const { data: document, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw Errors.notFound('Document not found')
      }
      throw new AppError('INTERNAL_ERROR', 'Failed to fetch document')
    }

    return document as unknown as DocumentWithRelations
  }

  /**
   * List documents for a student
   */
  static async listDocuments(
    studentId: string,
    freelancerId: string,
    filters?: DocumentFilters
  ): Promise<DocumentWithRelations[]> {
    const supabase = createClient()

    // Verify student belongs to freelancer
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('id', studentId)
      .eq('freelancer_id', freelancerId)
      .is('deleted_at', null)
      .single()

    if (studentError || !student) {
      throw Errors.notFound('Student not found or access denied')
    }

    let query = supabase
      .from('student_documents')
      .select(`
        *,
        uploaded_by_user:profiles!uploaded_by(id, full_name, email)
      `)
      .eq('student_id', studentId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (filters?.docType) {
      query = query.eq('doc_type', filters.docType)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data: documents, error } = await query

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to fetch documents')
    }

    return (documents || []) as unknown as DocumentWithRelations[]
  }

  /**
   * Update document status
   */
  static async updateDocumentStatus(
    id: string,
    freelancerId: string,
    status: DocumentStatus,
    data?: {
      notes?: string
      rejectionReason?: string
    }
  ): Promise<Document> {
    const supabase = createClient()

    // Get document with student info
    const { data: document, error: fetchError } = await supabase
      .from('student_documents')
      .select(`
        *,
        student:students!inner(freelancer_id)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !document) {
      throw Errors.notFound('Document not found')
    }

    // Verify ownership
    if (document.student.freelancer_id !== freelancerId) {
      throw Errors.forbidden('Access denied')
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (data?.notes) {
      updateData.notes = data.notes
    }

    if (status === 'rejected' && data?.rejectionReason) {
      updateData.rejection_reason = data.rejectionReason
    }

    const { data: updated, error } = await supabase
      .from('student_documents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to update document status')
    }

    return updated
  }

  /**
   * Replace a document (new version)
   */
  static async replaceDocument(
    id: string,
    freelancerId: string,
    data: {
      file: Buffer
      filename: string
      mimeType: string
      expiryDate?: string
      notes?: string
    }
  ): Promise<Document> {
    const supabase = createClient()

    // Get existing document
    const { data: existing, error: fetchError } = await supabase
      .from('student_documents')
      .select(`
        *,
        student:students!inner(freelancer_id)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !existing) {
      throw Errors.notFound('Document not found')
    }

    // Verify ownership
    if (existing.student.freelancer_id !== freelancerId) {
      throw Errors.forbidden('Access denied')
    }

    // Validate file
    const validation = validateFile(
      { size: data.file.length, type: data.mimeType } as File,
      existing.doc_type as DocumentType
    )
    if (!validation.valid) {
      throw new AppError('VALIDATION_ERROR', validation.error || 'Invalid file')
    }

    // Replace in Cloudinary
    const uploadResult = await CloudinaryService.replaceFile(
      existing.cloudinary_public_id,
      data.file,
      {
        folder: `student-portal/${freelancerId}/${existing.student_id}/documents`,
        tags: ['document', existing.doc_type],
        context: {
          student_id: existing.student_id,
          freelancer_id: freelancerId,
          doc_type: existing.doc_type,
        },
      }
    )

    // Update document record
    const { data: updated, error } = await supabase
      .from('student_documents')
      .update({
        file_name: data.filename,
        file_url: uploadResult.secure_url,
        file_size: data.file.length,
        mime_type: data.mimeType,
        cloudinary_public_id: uploadResult.public_id,
        cloudinary_resource_type: uploadResult.resource_type,
        cloudinary_format: uploadResult.format,
        cloudinary_version: uploadResult.version,
        cloudinary_asset_id: uploadResult.asset_id,
        expiry_date: data.expiryDate || existing.expiry_date,
        notes: data.notes || existing.notes,
        status: 'uploaded' as DocumentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to update document')
    }

    return updated
  }

  /**
   * Delete a document (soft delete)
   */
  static async deleteDocument(id: string, freelancerId: string): Promise<void> {
    const supabase = createClient()

    // Get document
    const { data: document, error: fetchError } = await supabase
      .from('student_documents')
      .select(`
        *,
        student:students!inner(freelancer_id)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !document) {
      throw Errors.notFound('Document not found')
    }

    // Verify ownership
    if (document.student.freelancer_id !== freelancerId) {
      throw Errors.forbidden('Access denied')
    }

    // Soft delete
    const { error } = await supabase
      .from('student_documents')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to delete document')
    }

    // Note: We keep the Cloudinary file for audit purposes
    // It can be cleaned up later via a background job
  }

  /**
   * Generate a secure download URL for a document
   */
  static async getDownloadUrl(
    id: string,
    freelancerId: string,
    expiresIn: number = 3600
  ): Promise<{ url: string; expiresAt: Date; filename: string }> {
    const supabase = createClient()

    // Get document
    const { data: document, error: fetchError } = await supabase
      .from('student_documents')
      .select(`
        *,
        student:students!inner(freelancer_id)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !document) {
      throw Errors.notFound('Document not found')
    }

    // Verify ownership
    if (document.student.freelancer_id !== freelancerId) {
      throw Errors.forbidden('Access denied')
    }

    // Generate secure URL
    const { url, expiresAt } = CloudinaryService.generateSecureUrl(
      document.cloudinary_public_id,
      {
        expiresIn,
        download: true,
      }
    )

    return {
      url,
      expiresAt,
      filename: document.file_name,
    }
  }

  /**
   * Get documents requiring review (expired or expiring soon)
   */
  static async getDocumentsRequiringReview(
    freelancerId: string,
    daysThreshold: number = 30
  ): Promise<DocumentWithRelations[]> {
    const supabase = createClient()

    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold)

    const { data: documents, error } = await supabase
      .from('student_documents')
      .select(`
        *,
        student:students!inner(
          id,
          name,
          email,
          freelancer_id
        ),
        uploaded_by_user:profiles!uploaded_by(id, full_name, email)
      `)
      .eq('student.freelancer_id', freelancerId)
      .is('deleted_at', null)
      .or(`expiry_date.lte.${thresholdDate.toISOString()},status.eq.expired`)

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to fetch documents')
    }

    return (documents || []) as unknown as DocumentWithRelations[]
  }

  /**
   * Link a document to an application
   */
  static async linkToApplication(
    documentId: string,
    applicationId: string,
    freelancerId: string,
    isRequired: boolean = true
  ): Promise<void> {
    const supabase = createClient()

    // Verify document and application belong to freelancer
    const { data: document, error: docError } = await supabase
      .from('student_documents')
      .select(`
        *,
        student:students!inner(freelancer_id)
      `)
      .eq('id', documentId)
      .is('deleted_at', null)
      .single()

    if (docError || !document) {
      throw Errors.notFound('Document not found')
    }

    if (document.student.freelancer_id !== freelancerId) {
      throw Errors.forbidden('Access denied')
    }

    // Verify application
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(`
        *,
        student:students!inner(freelancer_id)
      `)
      .eq('id', applicationId)
      .is('deleted_at', null)
      .single()

    if (appError || !application) {
      throw Errors.notFound('Application not found')
    }

    if (application.student.freelancer_id !== freelancerId) {
      throw Errors.forbidden('Access denied')
    }

    // Create link
    const { error } = await supabase
      .from('application_documents')
      .insert({
        application_id: applicationId,
        document_id: documentId,
        doc_type: document.doc_type,
        is_required: isRequired,
        is_uploaded: true,
        uploaded_at: new Date().toISOString(),
      })

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to link document to application')
    }
  }

  /**
   * Unlink a document from an application
   */
  static async unlinkFromApplication(
    documentId: string,
    applicationId: string,
    freelancerId: string
  ): Promise<void> {
    const supabase = createClient()

    // Verify ownership through application
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(`
        *,
        student:students!inner(freelancer_id)
      `)
      .eq('id', applicationId)
      .is('deleted_at', null)
      .single()

    if (appError || !application) {
      throw Errors.notFound('Application not found')
    }

    if (application.student.freelancer_id !== freelancerId) {
      throw Errors.forbidden('Access denied')
    }

    // Delete link
    const { error } = await supabase
      .from('application_documents')
      .delete()
      .eq('application_id', applicationId)
      .eq('document_id', documentId)

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to unlink document')
    }
  }
}
