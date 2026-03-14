export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'freelancer'
export type StudentStatus = 'lead' | 'active' | 'inactive' | 'enrolled' | 'archived'
export type DocumentStatus = 'uploaded' | 'under_review' | 'approved' | 'rejected' | 'expired'
export type DocumentType = 
  | 'passport' 
  | 'national_id' 
  | 'photo' 
  | 'academic_transcript' 
  | 'degree_certificate' 
  | 'marksheet' 
  | 'recommendation_letter' 
  | 'statement_of_purpose' 
  | 'cv_resume' 
  | 'language_test_score' 
  | 'financial_proof' 
  | 'bank_statement' 
  | 'sponsorship_letter' 
  | 'medical_report' 
  | 'police_clearance' 
  | 'visa_document' 
  | 'admission_letter' 
  | 'scholarship_letter' 
  | 'other'

export type ApplicationStatus = 
  | 'draft'
  | 'documents_pending'
  | 'ready_to_submit'
  | 'submitted'
  | 'under_review'
  | 'additional_info_needed'
  | 'conditional_offer'
  | 'unconditional_offer'
  | 'offer_accepted'
  | 'offer_declined'
  | 'visa_processing'
  | 'enrolled'
  | 'rejected'
  | 'withdrawn'
  | 'deferred'

export type DegreeType = 'bachelor' | 'master' | 'phd' | 'diploma' | 'certificate'
export type CommissionStatus = 'not_applicable' | 'pending' | 'approved' | 'invoiced' | 'paid' | 'disputed'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: UserRole
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          role?: UserRole
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: UserRole
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      students: {
        Row: {
          id: string
          freelancer_id: string
          full_name: string
          email: string | null
          phone: string
          date_of_birth: string | null
          gender: string | null
          nationality: string | null
          address: string | null
          city: string | null
          state: string | null
          pincode: string | null
          country: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          previous_education: string | null
          work_experience: string | null
          source: string | null
          tags: string[] | null
          status: StudentStatus
          profile_complete: number
          total_applications: number
          total_documents: number
          notes: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          freelancer_id: string
          full_name: string
          email?: string | null
          phone: string
          date_of_birth?: string | null
          gender?: string | null
          nationality?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          pincode?: string | null
          country?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          previous_education?: string | null
          work_experience?: string | null
          source?: string | null
          tags?: string[] | null
          status?: StudentStatus
          profile_complete?: number
          total_applications?: number
          total_documents?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          freelancer_id?: string
          full_name?: string
          email?: string | null
          phone?: string
          date_of_birth?: string | null
          gender?: string | null
          nationality?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          pincode?: string | null
          country?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          previous_education?: string | null
          work_experience?: string | null
          source?: string | null
          tags?: string[] | null
          status?: StudentStatus
          profile_complete?: number
          total_applications?: number
          total_documents?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      universities: {
        Row: {
          id: string
          name: string
          country: string
          city: string | null
          website: string | null
          logo_url: string | null
          ranking: number | null
          description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          country: string
          city?: string | null
          website?: string | null
          logo_url?: string | null
          ranking?: number | null
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          country?: string
          city?: string | null
          website?: string | null
          logo_url?: string | null
          ranking?: number | null
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      programs: {
        Row: {
          id: string
          university_id: string
          name: string
          degree_type: DegreeType
          duration_months: number | null
          tuition_fee: number | null
          currency: string
          language: string | null
          description: string | null
          requirements: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          university_id: string
          name: string
          degree_type: DegreeType
          duration_months?: number | null
          tuition_fee?: number | null
          currency?: string
          language?: string | null
          description?: string | null
          requirements?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          university_id?: string
          name?: string
          degree_type?: DegreeType
          duration_months?: number | null
          tuition_fee?: number | null
          currency?: string
          language?: string | null
          description?: string | null
          requirements?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          student_id: string
          university_id: string
          program_id: string
          intake_date: string
          status: ApplicationStatus
          application_fee_paid: boolean
          application_fee_amount: number | null
          notes: string | null
          submitted_at: string | null
          decision_at: string | null
          enrollment_at: string | null
          commission_amount: number | null
          commission_status: CommissionStatus
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          student_id: string
          university_id: string
          program_id: string
          intake_date: string
          status?: ApplicationStatus
          application_fee_paid?: boolean
          application_fee_amount?: number | null
          notes?: string | null
          submitted_at?: string | null
          decision_at?: string | null
          enrollment_at?: string | null
          commission_amount?: number | null
          commission_status?: CommissionStatus
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          university_id?: string
          program_id?: string
          intake_date?: string
          status?: ApplicationStatus
          application_fee_paid?: boolean
          application_fee_amount?: number | null
          notes?: string | null
          submitted_at?: string | null
          decision_at?: string | null
          enrollment_at?: string | null
          commission_amount?: number | null
          commission_status?: CommissionStatus
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      student_documents: {
        Row: {
          id: string
          student_id: string
          doc_type: DocumentType
          custom_label: string | null
          file_name: string
          file_url: string
          file_size: number
          mime_type: string
          cloudinary_public_id: string
          cloudinary_resource_type: string
          cloudinary_format: string
          cloudinary_version: number
          cloudinary_asset_id: string | null
          status: DocumentStatus
          version: number
          is_latest: boolean
          uploaded_by: string | null
          rejection_reason: string | null
          expiry_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          doc_type: DocumentType
          custom_label?: string | null
          file_name: string
          file_url: string
          file_size: number
          mime_type: string
          cloudinary_public_id: string
          cloudinary_resource_type: string
          cloudinary_format: string
          cloudinary_version?: number
          cloudinary_asset_id?: string | null
          status?: DocumentStatus
          version?: number
          is_latest?: boolean
          uploaded_by?: string | null
          rejection_reason?: string | null
          expiry_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          doc_type?: DocumentType
          custom_label?: string | null
          file_name?: string
          file_url?: string
          file_size?: number
          mime_type?: string
          cloudinary_public_id?: string
          cloudinary_resource_type?: string
          cloudinary_format?: string
          cloudinary_version?: number
          cloudinary_asset_id?: string | null
          status?: DocumentStatus
          version?: number
          is_latest?: boolean
          uploaded_by?: string | null
          rejection_reason?: string | null
          expiry_date?: string | null
          created_at?: string
        }
      }
      application_documents: {
        Row: {
          id: string
          application_id: string
          document_id: string | null
          doc_type: DocumentType
          is_required: boolean
          is_uploaded: boolean
          uploaded_at: string | null
        }
        Insert: {
          id?: string
          application_id: string
          document_id?: string | null
          doc_type: DocumentType
          is_required?: boolean
          is_uploaded?: boolean
          uploaded_at?: string | null
        }
        Update: {
          id?: string
          application_id?: string
          document_id?: string | null
          doc_type?: DocumentType
          is_required?: boolean
          is_uploaded?: boolean
          uploaded_at?: string | null
        }
      }
      status_history: {
        Row: {
          id: string
          entity_type: 'student' | 'application' | 'document'
          entity_id: string
          old_status: string | null
          new_status: string
          changed_by: string | null
          reason: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          entity_type: 'student' | 'application' | 'document'
          entity_id: string
          old_status?: string | null
          new_status: string
          changed_by?: string | null
          reason?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          entity_type?: 'student' | 'application' | 'document'
          entity_id?: string
          old_status?: string | null
          new_status?: string
          changed_by?: string | null
          reason?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      activity_log: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          details: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type?: string | null
          entity_id?: string | null
          details?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          details?: Json | null
          ip_address?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          is_read: boolean
          link: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          is_read?: boolean
          link?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          is_read?: boolean
          link?: string | null
          created_at?: string
        }
      }
      commissions: {
        Row: {
          id: string
          application_id: string
          freelancer_id: string
          amount: number
          status: CommissionStatus
          invoice_number: string | null
          paid_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id: string
          freelancer_id: string
          amount: number
          status?: CommissionStatus
          invoice_number?: string | null
          paid_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          freelancer_id?: string
          amount?: number
          status?: CommissionStatus
          invoice_number?: string | null
          paid_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      get_freelancer_stats: {
        Args: { freelancer_id: string }
        Returns: {
          totalStudents: number
          totalApplications: number
          totalEarnings: number
          pendingApplications: number
          conversionRate: number
        }
      }
      get_system_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          totalStudents: number
          totalFreelancers: number
          totalApplications: number
          enrolledStudents: number
          totalRevenue: number
        }
      }
      get_top_freelancers: {
        Args: { limit_count: number }
        Returns: {
          freelancer_id: string
          full_name: string
          total_students: number
          total_applications: number
          total_earnings: number
        }[]
      }
      award_coins: {
        Args: { profile_id: string; amount: number; reason: string }
        Returns: void
      }
    }
  }
}
