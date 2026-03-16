import { createClient } from '@/lib/supabase/server'
import { AppError, Errors } from '@/lib/utils/error'
import { validateStudentTransition } from '@/lib/state-machines/student-status'
import { CloudinaryService } from './cloudinary-service'
import type { 
  Student, 
  StudentInsert, 
  StudentUpdate,
  ApplicationInsert,
  DocumentInsert,
  StudentWithRelations,
  PaginatedStudentsResponse,
  StudentFilters,
  StudentSort
} from '@/types/api'
import type { StudentStatus, ApplicationStatus } from '@/types/database'

export class StudentService {
  /**
   * Create a new student with optional application and documents
   */
  static async createStudentWithApplication(
    freelancerId: string,
    data: {
      student: Omit<StudentInsert, 'freelancer_id' | 'status'>
      application?: {
        universityId: string
        programId: string
        intakeDate: string
      } | null
      documents?: Array<{
        file: Buffer
        filename: string
        docType: string
        mimeType: string
        expiryDate?: string
      }>
    }
  ): Promise<StudentWithRelations> {
    const supabase = createClient()

    try {
      // Start a transaction by using RPC or multiple operations
      // Determine initial status based on whether application is being created
      const initialStatus: StudentStatus = data.application ? 'active' : 'lead'

      // Create student
      const { data: student, error: studentError } = await supabase
        .from('students')
        .insert({
          ...data.student,
          freelancer_id: freelancerId,
          status: initialStatus,
        })
        .select()
        .single()

      if (studentError) {
        throw new AppError('CONFLICT', 'Failed to create student: ' + studentError.message)
      }

      let application = null
      let uploadedDocuments: DocumentInsert[] = []

      // Create application if provided
      if (data.application) {
        const { data: app, error: appError } = await supabase
          .from('applications')
          .insert({
            student_id: student.id,
            university_id: data.application.universityId,
            program_id: data.application.programId,
            intake_date: data.application.intakeDate,
            status: 'documents_pending' as ApplicationStatus,
          })
          .select()
          .single()

        if (appError) {
          // Rollback student creation
          await supabase.from('students').delete().eq('id', student.id)
          throw new AppError('CONFLICT', 'Failed to create application: ' + appError.message)
        }

        application = app
      }

      // Upload documents if provided
      if (data.documents && data.documents.length > 0) {
        for (const doc of data.documents) {
          // Upload to Cloudinary
          const folder = `student-portal/${freelancerId}/${student.id}/${doc.docType}`
          const uploadResult = await CloudinaryService.uploadFile(doc.file, doc.filename, {
            folder,
            tags: ['student', doc.docType],
            context: {
              student_id: student.id,
              freelancer_id: freelancerId,
              doc_type: doc.docType,
            },
          })

          // Create document record
          const { data: document, error: docError } = await supabase
            .from('student_documents')
            .insert({
              student_id: student.id,
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
            // Clean up Cloudinary file
            await CloudinaryService.deleteFile(uploadResult.public_id)
            console.error('Failed to create document record:', docError)
            continue
          }

          uploadedDocuments.push(document)

          // Link document to application if exists
          if (application) {
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
      }

      // Return student with relations
      const { data: studentWithRelations, error: fetchError } = await supabase
        .from('students')
        .select(`
          *,
          applications:applications(*),
          documents:student_documents(*)
        `)
        .eq('id', student.id)
        .single()

      if (fetchError) {
        throw new AppError('INTERNAL_ERROR', 'Failed to fetch created student')
      }

      return studentWithRelations as StudentWithRelations
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('INTERNAL_ERROR', 'Failed to create student with application')
    }
  }

  /**
   * Get a single student by ID with all relations
   */
  static async getStudentById(
    id: string,
    freelancerId?: string
  ): Promise<StudentWithRelations> {
    const supabase = createClient()

    let query = supabase
      .from('students')
      .select(`
        *,
        applications:applications(
          *,
          university_id,
          program_id
        ),
        documents:student_documents(*),
        freelancer:profiles(id, full_name, email)
      `)
      .eq('id', id)

    // If freelancerId provided, ensure they own this student
    if (freelancerId) {
      query = query.eq('freelancer_id', freelancerId)
    }

    const { data: student, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw Errors.notFound('Student not found')
      }
      throw new AppError('INTERNAL_ERROR', 'Failed to fetch student')
    }

    return student as unknown as StudentWithRelations
  }

  /**
   * List students with pagination, filtering, and sorting
   */
  static async listStudents(
    freelancerId: string,
    filters: StudentFilters,
    sort: StudentSort,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedStudentsResponse> {
    const supabase = createClient()

    const offset = (page - 1) * limit

    // Build base query
    let query = supabase
      .from('students')
      .select(`
        *,
        applications:applications(
          id,
          status,
          university_id,
          program_id
        )
      `, { count: 'exact' })

    // Apply freelancer filter if provided
    if (freelancerId) {
      query = query.eq('freelancer_id', freelancerId)
    }

    // Apply filters
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
    }

    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }

    if (filters.source) {
      query = query.eq('source', filters.source)
    }

    if (filters.tags && filters.tags.length > 0) {
      // Check if any of the tags overlap
      query = query.contains('tags', filters.tags)
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    // Apply sorting
    const orderColumn = sort.sortBy === 'name' ? 'name' : sort.sortBy
    query = query.order(orderColumn, { ascending: sort.sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: students, error, count } = await query

    if (error) {
      throw new AppError('INTERNAL_ERROR', `Supabase Error: ${error.message} (${error.code})`)
    }

    // Get filter options
    let optionsQuery = supabase
      .from('students')
      .select('source, tags')
    
    if (freelancerId) {
      optionsQuery = optionsQuery.eq('freelancer_id', freelancerId)
    }

    const { data: filterOptions } = await optionsQuery

    const sources = Array.from(new Set(filterOptions?.map(s => s.source).filter(Boolean)))
    const allTags = Array.from(new Set(filterOptions?.flatMap(s => s.tags || []).filter(Boolean)))

    return {
      students: (students || []) as unknown as StudentWithRelations[],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: (page * limit) < (count || 0),
      },
      filters: {
        programs: [], // Would need separate query
        universities: [], // Would need separate query
        sources,
        tags: allTags,
      },
    }
  }

  /**
   * Update a student
   */
  static async updateStudent(
    id: string,
    freelancerId: string,
    data: StudentUpdate
  ): Promise<Student> {
    const supabase = createClient()

    // First check if student exists and belongs to freelancer
    const { data: existing, error: checkError } = await supabase
      .from('students')
      .select('id')
      .eq('id', id)
      .eq('freelancer_id', freelancerId)
      .single()

    if (checkError || !existing) {
      throw Errors.notFound('Student not found or access denied')
    }

    const { data: student, error } = await supabase
      .from('students')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to update student')
    }

    return student
  }

  /**
   * Update student status with validation
   */
  static async updateStudentStatus(
    id: string,
    freelancerId: string,
    newStatus: StudentStatus,
    reason?: string
  ): Promise<Student> {
    const supabase = createClient()

    // Get current student
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select('status')
      .eq('id', id)
      .eq('freelancer_id', freelancerId)
      .single()

    if (fetchError || !student) {
      throw Errors.notFound('Student not found')
    }

    // Validate status transition
    const validation = validateStudentTransition(student.status as StudentStatus, newStatus)
    if (!validation.valid) {
      throw new AppError('INVALID_STATUS_TRANSITION', validation.error || 'Invalid status transition')
    }

    // Update status
    const { data: updated, error } = await supabase
      .from('students')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to update student status')
    }

    // Log status change
    await supabase.from('status_history').insert({
      entity_type: 'student',
      entity_id: id,
      old_status: student.status,
      new_status: newStatus,
      changed_by: freelancerId,
      reason: reason || null,
    })

    return updated
  }

  /**
   * Soft delete a student (check for active applications first)
   */
  static async deleteStudent(id: string, freelancerId: string): Promise<void> {
    const supabase = createClient()

    // Check for active applications
    const { data: activeApps, error: checkError } = await supabase
      .from('applications')
      .select('id')
      .eq('student_id', id)
      .not('status', 'in', '("enrolled","rejected","withdrawn","offer_declined")')
    // Hard delete since table has no deleted_at column
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id)
      .eq('freelancer_id', freelancerId)

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to delete student')
    }
  }

  /**
   * Check for duplicate student (same phone or email for same freelancer)
   */
  static async checkDuplicate(
    freelancerId: string,
    data: { email?: string; phone?: string },
    excludeId?: string
  ): Promise<{ isDuplicate: boolean; existingStudent?: Student }> {
    const supabase = createClient()

    let query = supabase
      .from('students')
      .select()
      .eq('freelancer_id', freelancerId)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    // Build OR condition for email or phone
    const conditions: string[] = []
    if (data.email) {
      conditions.push(`email.eq.${data.email}`)
    }
    if (data.phone) {
      conditions.push(`phone.eq.${data.phone}`)
    }

    if (conditions.length === 0) {
      return { isDuplicate: false }
    }

    query = query.or(conditions.join(','))

    const { data: existing, error } = await query.limit(1).single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { isDuplicate: false }
      }
      throw new AppError('INTERNAL_ERROR', 'Failed to check for duplicates')
    }

    return { isDuplicate: true, existingStudent: existing }
  }

  /**
   * Bulk update students
   */
  static async bulkUpdate(
    freelancerId: string,
    ids: string[],
    data: Partial<StudentUpdate>
  ): Promise<{ updated: number; failed: string[] }> {
    const supabase = createClient()
    const failed: string[] = []

    // Verify all students belong to this freelancer
    const { data: students, error: checkError } = await supabase
      .from('students')
      .select('id')
      .in('id', ids)
      .eq('freelancer_id', freelancerId)

    if (checkError) {
      throw new AppError('INTERNAL_ERROR', 'Failed to verify students')
    }

    const validIds = students?.map(s => s.id) || []
    const invalidIds = ids.filter(id => !validIds.includes(id))

    if (invalidIds.length > 0) {
      failed.push(...invalidIds)
    }

    if (validIds.length === 0) {
      return { updated: 0, failed }
    }

    // Perform bulk update
    const { error } = await supabase
      .from('students')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .in('id', validIds)

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to update students')
    }

    return { updated: validIds.length, failed }
  }
}
