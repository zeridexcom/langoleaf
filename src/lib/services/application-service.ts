import { createClient } from '@/lib/supabase/server'
import { AppError, Errors } from '@/lib/utils/error'
import { validateTransition as validateApplicationTransition } from '@/lib/state-machines/application-status'
import { CloudinaryService } from './cloudinary-service'
import type { 
  Application, 
  ApplicationInsert, 
  ApplicationUpdate,
  ApplicationWithRelations,
  ApplicationFilters,
  DocumentInsert
} from '@/types/api'
import type { ApplicationStatus } from '@/types/database'

interface ApplicationSort {
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface PaginatedApplicationsResponse {
  applications: ApplicationWithRelations[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

export class ApplicationService {
  /**
   * Create a new application for a student
   */
  static async createApplication(
    freelancerId: string,
    data: {
      studentId: string
      universityId: string
      programId: string
      intakeDate: string
      notes?: string
      documents?: Array<{
        file: Buffer
        filename: string
        docType: string
        mimeType: string
        expiryDate?: string
      }>
    }
  ): Promise<ApplicationWithRelations> {
    const supabase = createClient()

    try {
      // Verify student belongs to freelancer
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, status')
        .eq('id', data.studentId)
        .eq('freelancer_id', freelancerId)
        .is('deleted_at', null)
        .single()

      if (studentError || !student) {
        throw Errors.notFound('Student not found or access denied')
      }

      // Create application
      const { data: application, error: appError } = await supabase
        .from('applications')
        .insert({
          student_id: data.studentId,
          university_id: data.universityId,
          program_id: data.programId,
          intake_date: data.intakeDate,
          status: 'documents_pending' as ApplicationStatus,
          notes: data.notes || null,
        })
        .select()
        .single()

      if (appError) {
        throw new AppError('CONFLICT', 'Failed to create application: ' + appError.message)
      }

      // Update student status to active if currently lead
      if (student.status === 'lead') {
        await supabase
          .from('students')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('id', data.studentId)
      }

      // Upload documents if provided
      if (data.documents && data.documents.length > 0) {
        for (const doc of data.documents) {
          const folder = `student-portal/${freelancerId}/${data.studentId}/applications/${application.id}`
          const uploadResult = await CloudinaryService.uploadFile(doc.file, doc.filename, {
            folder,
            tags: ['application', doc.docType],
            context: {
              student_id: data.studentId,
              application_id: application.id,
              freelancer_id: freelancerId,
              doc_type: doc.docType,
            },
          })

          // Create document record
          const { data: document, error: docError } = await supabase
            .from('student_documents')
            .insert({
              student_id: data.studentId,
              doc_type: doc.docType as any,
              file_name: doc.filename,
              file_url: uploadResult.secure_url,
              file_size: doc.file.length,
              mime_type: doc.mimeType,
              cloudinary_public_id: uploadResult.public_id,
              cloudinary_resource_type: uploadResult.resource_type,
              cloudinary_format: uploadResult.format,
              cloudinary_version: uploadResult.version,
              cloudinary_asset_id: uploadResult.asset_id,
              expiry_date: doc.expiryDate || null,
              uploaded_by: freelancerId,
            })
            .select()
            .single()

          if (docError) {
            await CloudinaryService.deleteFile(uploadResult.public_id)
            console.error('Failed to create document record:', docError)
            continue
          }

          // Link to application
          await supabase.from('application_documents').insert({
            application_id: application.id,
            document_id: document.id,
            doc_type: doc.docType as any,
            is_required: true,
            is_uploaded: true,
            uploaded_at: new Date().toISOString(),
          })
        }
      }

      // Return application with relations
      const { data: appWithRelations, error: fetchError } = await supabase
        .from('applications')
        .select(`
          *,
          student:students(*),
          university:universities(*),
          program:programs(*),
          documents:application_documents(
            *,
            document:student_documents(*)
          )
        `)
        .eq('id', application.id)
        .single()

      if (fetchError) {
        throw new AppError('INTERNAL_ERROR', 'Failed to fetch created application')
      }

      return appWithRelations as unknown as ApplicationWithRelations
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('INTERNAL_ERROR', 'Failed to create application')
    }
  }

  /**
   * Get a single application by ID with all relations
   */
  static async getApplicationById(
    id: string,
    freelancerId?: string
  ): Promise<ApplicationWithRelations> {
    const supabase = createClient()

    // Build base query
    let query = supabase
      .from('applications')
      .select(`
        *,
        student:students(*),
        university:universities(*),
        program:programs(*),
        documents:application_documents(
          *,
          document:student_documents(*)
        ),
        status_history:status_history(*)
      `)
      .eq('id', id)
      .is('deleted_at', null)

    // If freelancerId provided, ensure they own this application
    if (freelancerId) {
      query = query.eq('student.freelancer_id', freelancerId)
    }

    const { data: application, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw Errors.notFound('Application not found')
      }
      throw new AppError('INTERNAL_ERROR', 'Failed to fetch application')
    }

    return application as unknown as ApplicationWithRelations
  }

  /**
   * List applications with pagination, filtering, and sorting
   */
  static async listApplications(
    freelancerId: string,
    filters: ApplicationFilters,
    sort: ApplicationSort,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedApplicationsResponse> {
    const supabase = createClient()

    const offset = (page - 1) * limit

    // Build base query
    let query = supabase
      .from('applications')
      .select(`
        *,
        student:students!inner(
          id,
          full_name,
          email,
          phone,
          freelancer_id
        ),
        university:universities(id, name, country),
        program:programs(id, name, degree_type)
      `, { count: 'exact' })
      .eq('student.freelancer_id', freelancerId)
      .is('deleted_at', null)

    // Apply filters
    if (filters.search) {
      query = query.or(`student.full_name.ilike.%${filters.search}%,university.name.ilike.%${filters.search}%`)
    }

    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }

    if (filters.studentId) {
      query = query.eq('student_id', filters.studentId)
    }

    if (filters.universityId) {
      query = query.eq('university_id', filters.universityId)
    }

    if (filters.programId) {
      query = query.eq('program_id', filters.programId)
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    // Apply sorting
    const orderColumn = sort.sortBy
    query = query.order(orderColumn, { ascending: sort.sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: applications, error, count } = await query

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to fetch applications')
    }

    return {
      applications: (applications || []) as unknown as ApplicationWithRelations[],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: (page * limit) < (count || 0),
      },
    }
  }

  /**
   * Update application status with validation
   */
  static async updateApplicationStatus(
    id: string,
    freelancerId: string,
    newStatus: ApplicationStatus,
    data?: {
      reason?: string
      notes?: string
      commissionAmount?: number
      commissionCurrency?: string
    }
  ): Promise<Application> {
    const supabase = createClient()

    // Get current application
    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select(`
        *,
        student:students!inner(freelancer_id)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !application) {
      throw Errors.notFound('Application not found')
    }

    // Verify ownership
    if (application.student.freelancer_id !== freelancerId) {
      throw Errors.forbidden('Access denied')
    }

    // Validate status transition
    const validation = validateApplicationTransition(
      application.status as ApplicationStatus,
      newStatus
    )
    if (!validation.valid) {
      throw new AppError('INVALID_STATUS_TRANSITION', validation.error || 'Invalid status transition')
    }

    // Build update data
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }

    if (data?.notes) {
      updateData.notes = data.notes
    }

    if (data?.commissionAmount !== undefined) {
      updateData.commission_amount = data.commissionAmount
    }

    if (data?.commissionCurrency) {
      updateData.commission_currency = data.commissionCurrency
    }

    // Update application
    const { data: updated, error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to update application status')
    }

    // Log status change
    await supabase.from('status_history').insert({
      entity_type: 'application',
      entity_id: id,
      old_status: application.status,
      new_status: newStatus,
      changed_by: freelancerId,
      reason: data?.reason || null,
    })

    // If enrolled, update student status
    if (newStatus === 'enrolled') {
      await supabase
        .from('students')
        .update({ status: 'enrolled', updated_at: new Date().toISOString() })
        .eq('id', application.student_id)
    }

    return updated
  }

  /**
   * Update application details
   */
  static async updateApplication(
    id: string,
    freelancerId: string,
    data: ApplicationUpdate
  ): Promise<Application> {
    const supabase = createClient()

    // Verify ownership
    const { data: application, error: checkError } = await supabase
      .from('applications')
      .select(`
        *,
        student:students!inner(freelancer_id)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (checkError || !application) {
      throw Errors.notFound('Application not found')
    }

    if (application.student.freelancer_id !== freelancerId) {
      throw Errors.forbidden('Access denied')
    }

    // Don't allow updates to terminal statuses
    const terminalStatuses = ['enrolled', 'rejected', 'withdrawn', 'offer_declined']
    if (terminalStatuses.includes(application.status)) {
      throw new AppError('CONFLICT', 'Cannot update application in terminal status')
    }

    const { data: updated, error } = await supabase
      .from('applications')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to update application')
    }

    return updated
  }

  /**
   * Soft delete an application
   */
  static async deleteApplication(id: string, freelancerId: string): Promise<void> {
    const supabase = createClient()

    // Verify ownership
    const { data: application, error: checkError } = await supabase
      .from('applications')
      .select(`
        *,
        student:students!inner(freelancer_id)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (checkError || !application) {
      throw Errors.notFound('Application not found')
    }

    if (application.student.freelancer_id !== freelancerId) {
      throw Errors.forbidden('Access denied')
    }

    // Don't allow deletion of enrolled applications
    if (application.status === 'enrolled') {
      throw new AppError('CONFLICT', 'Cannot delete enrolled application')
    }

    // Soft delete
    const { error } = await supabase
      .from('applications')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to delete application')
    }
  }

  /**
   * Get applications by student ID
   */
  static async getApplicationsByStudent(
    studentId: string,
    freelancerId: string
  ): Promise<ApplicationWithRelations[]> {
    const supabase = createClient()

    const { data: applications, error } = await supabase
      .from('applications')
      .select(`
        *,
        university:universities(id, name, country),
        program:programs(id, name, degree_type),
        documents:application_documents(
          *,
          document:student_documents(*)
        )
      `)
      .eq('student_id', studentId)
      .eq('student.freelancer_id', freelancerId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to fetch applications')
    }

    return (applications || []) as unknown as ApplicationWithRelations[]
  }

  /**
   * Get application statistics for a freelancer
   */
  static async getApplicationStats(freelancerId: string): Promise<{
    total: number
    byStatus: Record<ApplicationStatus, number>
    recent: number
  }> {
    const supabase = createClient()

    const { data: applications, error } = await supabase
      .from('applications')
      .select('status, created_at')
      .eq('student.freelancer_id', freelancerId)
      .is('deleted_at', null)

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to fetch application stats')
    }

    const byStatus: Record<string, number> = {}
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    let recent = 0

    for (const app of applications || []) {
      byStatus[app.status] = (byStatus[app.status] || 0) + 1
      
      if (new Date(app.created_at) > thirtyDaysAgo) {
        recent++
      }
    }

    return {
      total: applications?.length || 0,
      byStatus: byStatus as Record<ApplicationStatus, number>,
      recent,
    }
  }
}
