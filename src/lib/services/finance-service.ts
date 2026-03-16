import { createClient } from '@/lib/supabase/server'
import { AppError } from '@/lib/utils/error'
import type { 
  Commission, 
  CommissionInsert, 
  CommissionUpdate,
  Payout,
  PayoutInsert,
  PayoutWithCommissions,
  CommissionFilters,
  ApiMeta
} from '@/types/api'
import type { CommissionStatus } from '@/types/database'

export class FinanceService {
  /**
   * List commissions with filters and pagination
   */
  static async listCommissions(
    filters: CommissionFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ commissions: Commission[]; pagination: ApiMeta }> {
    const supabase = createClient()
    const offset = (page - 1) * limit

    let query = supabase
      .from('commissions')
      .select('*', { count: 'exact' })

    // Apply filters
    if (filters.freelancerId) {
      query = query.eq('freelancer_id', filters.freelancerId)
    }
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }
    if (filters.applicationId) {
      query = query.eq('application_id', filters.applicationId)
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to fetch commissions: ' + error.message)
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return {
      commissions: data || [],
      pagination: {
        page,
        perPage: limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }
  }

  /**
   * Get pending earnings for a freelancer
   */
  static async getPendingEarnings(freelancerId: string): Promise<number> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('commissions')
      .select('amount')
      .eq('freelancer_id', freelancerId)
      .eq('status', 'pending')

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to calculate earnings: ' + error.message)
    }

    return data.reduce((sum, item) => sum + Number(item.amount), 0)
  }

  /**
   * Process a payout for a freelancer
   * Links all 'pending' commissions to a new payout record
   */
  static async processPayout(
    freelancerId: string,
    notes?: string
  ): Promise<PayoutWithCommissions> {
    const supabase = createClient()

    // 1. Get all pending commissions
    const { data: commissions, error: fetchError } = await supabase
      .from('commissions')
      .select('*')
      .eq('freelancer_id', freelancerId)
      .eq('status', 'pending')

    if (fetchError) {
      throw new AppError('INTERNAL_ERROR', 'Failed to fetch pending commissions')
    }

    if (!commissions || commissions.length === 0) {
      throw new AppError('BAD_REQUEST', 'No pending commissions to payout')
    }

    const totalAmount = commissions.reduce((sum, c) => sum + Number(c.amount), 0)

    // 2. Create Payout record
    const { data: payout, error: payoutError } = await supabase
      .from('payouts')
      .insert({
        freelancer_id: freelancerId,
        amount: totalAmount,
        status: 'processing',
        notes: notes || `Payout for ${commissions.length} commissions`
      })
      .select()
      .single()

    if (payoutError) {
      throw new AppError('INTERNAL_ERROR', 'Failed to create payout record')
    }

    // 3. Link commissions to payout and update status
    const { error: updateError } = await supabase
      .from('commissions')
      .update({
        status: 'paid' as CommissionStatus,
        payout_id: payout.id,
        paid_at: new Date().toISOString()
      })
      .in('id', commissions.map(c => c.id))

    if (updateError) {
      // Logic would ideally be in a transaction, but Supabase doesn't support them easily across service calls
      // In a real app, you'd use a Postgres Function (RPC) for this atomicity
      throw new AppError('INTERNAL_ERROR', 'Failed to link commissions to payout')
    }

    return {
      ...payout,
      commissions
    }
  }

  /**
   * Get overall stats for admin dashboard
   */
  static async getFinanceStats() {
    const supabase = createClient()

    const { data, error } = await supabase.rpc('get_system_analytics').single()
    const stats = data as any

    if (error) {
      // Fallback if RPC doesn't exist or fails
      const { data: commissions } = await supabase.from('commissions').select('amount, status')
      
      const totalRevenue = commissions?.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.amount), 0) || 0
      const pendingPayouts = commissions?.filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.amount), 0) || 0

      return {
        totalRevenue,
        pendingPayouts,
      }
    }

    return {
      totalRevenue: stats.total_revenue,
      pendingPayouts: 0, // Would need a separate query for pending specifically if not in RPC
    }
  }
}
