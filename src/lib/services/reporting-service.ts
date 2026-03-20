import { createClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/utils/error";

// Report Types
export type ReportType = 
  | "student_summary"
  | "application_pipeline"
  | "conversion_funnel"
  | "revenue_analysis"
  | "freelancer_performance"
  | "document_status"
  | "status_transitions";

export type ReportPeriod = "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "custom";

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  freelancerId?: string;
  status?: string[];
  universityId?: string;
  programId?: string;
}

export interface StudentSummaryReport {
  totalStudents: number;
  newStudents: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  byMonth: { month: string; count: number }[];
  profileCompletionAvg: number;
  topFreelancers: { id: string; name: string; count: number }[];
}

export interface ApplicationPipelineReport {
  totalApplications: number;
  byStatus: Record<string, number>;
  conversionRates: {
    stage: string;
    count: number;
    conversionRate: number;
  }[];
  avgTimeInStage: Record<string, number>;
  monthlyTrend: { month: string; count: number }[];
}

export interface ConversionFunnelReport {
  stages: {
    name: string;
    count: number;
    dropOff: number;
    conversionRate: number;
  }[];
  overallConversion: number;
  timeToConversion: number;
}

export interface RevenueAnalysisReport {
  totalRevenue: number;
  byStatus: Record<string, number>;
  byMonth: { month: string; amount: number }[];
  byFreelancer: { id: string; name: string; amount: number }[];
  projectedRevenue: number;
  collectionRate: number;
}

export interface FreelancerPerformanceReport {
  freelancers: {
    id: string;
    name: string;
    email: string;
    totalStudents: number;
    totalApplications: number;
    enrollments: number;
    conversionRate: number;
    revenue: number;
    avgResponseTime: number;
    lastActive: string;
  }[];
  rankings: {
    byStudents: { id: string; name: string; value: number }[];
    byRevenue: { id: string; name: string; value: number }[];
    byConversion: { id: string; name: string; value: number }[];
  };
}

export interface DocumentStatusReport {
  totalDocuments: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  pendingReview: number;
  expiredDocuments: number;
  expiringSoon: number;
  uploadTrend: { month: string; count: number }[];
}

export interface StatusTransitionReport {
  totalTransitions: number;
  byTransition: {
    from: string;
    to: string;
    count: number;
    avgTime: number;
  }[];
  mostCommonPaths: {
    path: string;
    count: number;
    successRate: number;
  }[];
}

export class ReportingService {
  private supabaseInstance: ReturnType<typeof createClient> | null = null;

  private get supabase() {
    if (!this.supabaseInstance) {
      this.supabaseInstance = createClient();
    }
    return this.supabaseInstance;
  }

  async generateStudentSummaryReport(filters?: ReportFilters): Promise<StudentSummaryReport> {
    try {
      let query = this.supabase
        .from("students")
        .select("*", { count: "exact" });

      // Apply filters
      if (filters?.startDate) {
        query = query.gte("created_at", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("created_at", filters.endDate);
      }
      if (filters?.freelancerId) {
        query = query.eq("freelancer_id", filters.freelancerId);
      }

      const { data: students, error, count } = await query;

      if (error) throw error;

      // Calculate metrics
      const byStatus: Record<string, number> = {};
      const bySource: Record<string, number> = {};
      const byMonth: Record<string, number> = {};
      let totalProfileCompletion = 0;

      students?.forEach((student) => {
        // By status
        byStatus[student.status] = (byStatus[student.status] || 0) + 1;

        // By source
        const source = student.source || "Unknown";
        bySource[source] = (bySource[source] || 0) + 1;

        // By month
        const month = new Date(student.created_at).toISOString().slice(0, 7);
        byMonth[month] = (byMonth[month] || 0) + 1;

        // Profile completion
        totalProfileCompletion += student.profile_completion || 0;
      });

      // Get top freelancers
      const { data: freelancerStats } = await this.supabase
        .from("students")
        .select("freelancer_id, profiles(full_name)")
        .order("created_at", { ascending: false });

      const freelancerCounts: Record<string, { name: string; count: number }> = {};
      freelancerStats?.forEach((s: any) => {
        const id = s.freelancer_id;
        const name = s.profiles?.full_name || "Unknown";
        if (!freelancerCounts[id]) {
          freelancerCounts[id] = { name, count: 0 };
        }
        freelancerCounts[id].count++;
      });

      const topFreelancers = Object.entries(freelancerCounts)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate new students (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newStudents = students?.filter(
        (s) => new Date(s.created_at) >= thirtyDaysAgo
      ).length || 0;

      return {
        totalStudents: count || 0,
        newStudents,
        byStatus,
        bySource,
        byMonth: Object.entries(byMonth)
          .map(([month, count]) => ({ month, count }))
          .sort((a, b) => a.month.localeCompare(b.month)),
        profileCompletionAvg: count ? Math.round(totalProfileCompletion / count) : 0,
        topFreelancers,
      };
    } catch (error) {
      console.error("Error generating student summary report:", error);
      throw new AppError(
        "INTERNAL_ERROR",
        "Failed to generate student summary report"
      );
    }
  }

  async generateApplicationPipelineReport(filters?: ReportFilters): Promise<ApplicationPipelineReport> {
    try {
      let query = this.supabase
        .from("applications")
        .select("*, students!inner(freelancer_id)", { count: "exact" });

      if (filters?.startDate) {
        query = query.gte("created_at", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("created_at", filters.endDate);
      }
      if (filters?.freelancerId) {
        query = query.eq("students.freelancer_id", filters.freelancerId);
      }
      if (filters?.status?.length) {
        query = query.in("status", filters.status);
      }

      const { data: applications, error, count } = await query;

      if (error) throw error;

      // Calculate by status
      const byStatus: Record<string, number> = {};
      applications?.forEach((app) => {
        byStatus[app.status] = (byStatus[app.status] || 0) + 1;
      });

      // Calculate conversion rates
      const stages = [
        { name: "draft", label: "Draft" },
        { name: "documents_pending", label: "Documents Pending" },
        { name: "ready_to_submit", label: "Ready to Submit" },
        { name: "submitted", label: "Submitted" },
        { name: "under_review", label: "Under Review" },
        { name: "offer_received", label: "Offer Received" },
        { name: "enrolled", label: "Enrolled" },
      ];

      const conversionRates = stages.map((stage, index) => {
        const stageCount = byStatus[stage.name] || 0;
        const previousCount = index > 0 ? (byStatus[stages[index - 1].name] || 0) : stageCount;
        const conversionRate = previousCount > 0 ? (stageCount / previousCount) * 100 : 0;

        return {
          stage: stage.label,
          count: stageCount,
          conversionRate: Math.round(conversionRate * 100) / 100,
        };
      });

      // Monthly trend
      const byMonth: Record<string, number> = {};
      applications?.forEach((app) => {
        const month = new Date(app.created_at).toISOString().slice(0, 7);
        byMonth[month] = (byMonth[month] || 0) + 1;
      });

      return {
        totalApplications: count || 0,
        byStatus,
        conversionRates,
        avgTimeInStage: {}, // Would need status_history data
        monthlyTrend: Object.entries(byMonth)
          .map(([month, count]) => ({ month, count }))
          .sort((a, b) => a.month.localeCompare(b.month)),
      };
    } catch (error) {
      console.error("Error generating application pipeline report:", error);
      throw new AppError(
        "INTERNAL_ERROR",
        "Failed to generate application pipeline report"
      );
    }
  }

  async generateConversionFunnelReport(filters?: ReportFilters): Promise<ConversionFunnelReport> {
    try {
      const { data: applications } = await this.supabase
        .from("applications")
        .select("status, created_at, updated_at");

      if (!applications) {
        return {
          stages: [],
          overallConversion: 0,
          timeToConversion: 0,
        };
      }

      const totalApps = applications.length;
      const enrolled = applications.filter((a) => a.status === "enrolled").length;
      const offerReceived = applications.filter((a) => a.status === "offer_received").length;
      const underReview = applications.filter((a) => a.status === "under_review").length;
      const submitted = applications.filter((a) => a.status === "submitted").length;

      const stages = [
        {
          name: "Submitted",
          count: submitted,
          dropOff: totalApps - submitted,
          conversionRate: totalApps > 0 ? (submitted / totalApps) * 100 : 0,
        },
        {
          name: "Under Review",
          count: underReview,
          dropOff: submitted - underReview,
          conversionRate: submitted > 0 ? (underReview / submitted) * 100 : 0,
        },
        {
          name: "Offer Received",
          count: offerReceived,
          dropOff: underReview - offerReceived,
          conversionRate: underReview > 0 ? (offerReceived / underReview) * 100 : 0,
        },
        {
          name: "Enrolled",
          count: enrolled,
          dropOff: offerReceived - enrolled,
          conversionRate: offerReceived > 0 ? (enrolled / offerReceived) * 100 : 0,
        },
      ];

      return {
        stages,
        overallConversion: totalApps > 0 ? (enrolled / totalApps) * 100 : 0,
        timeToConversion: 0, // Would need more detailed tracking
      };
    } catch (error) {
      console.error("Error generating conversion funnel report:", error);
      throw new AppError(
        "INTERNAL_ERROR",
        "Failed to generate conversion funnel report"
      );
    }
  }

  async generateRevenueAnalysisReport(filters?: ReportFilters): Promise<RevenueAnalysisReport> {
    try {
      let query = this.supabase
        .from("applications")
        .select("*, students!inner(freelancer_id, profiles(full_name))")
        .not("commission_amount", "is", null);

      if (filters?.startDate) {
        query = query.gte("created_at", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("created_at", filters.endDate);
      }

      const { data: applications } = await query;

      let totalRevenue = 0;
      const byStatus: Record<string, number> = {};
      const byMonth: Record<string, number> = {};
      const byFreelancer: Record<string, { name: string; amount: number }> = {};

      applications?.forEach((app: any) => {
        const amount = app.commission_amount || 0;
        totalRevenue += amount;

        // By status
        byStatus[app.status] = (byStatus[app.status] || 0) + amount;

        // By month
        const month = new Date(app.created_at).toISOString().slice(0, 7);
        byMonth[month] = (byMonth[month] || 0) + amount;

        // By freelancer
        const freelancerId = app.students?.freelancer_id;
        const freelancerName = app.students?.profiles?.full_name || "Unknown";
        if (freelancerId) {
          if (!byFreelancer[freelancerId]) {
            byFreelancer[freelancerId] = { name: freelancerName, amount: 0 };
          }
          byFreelancer[freelancerId].amount += amount;
        }
      });

      return {
        totalRevenue,
        byStatus,
        byMonth: Object.entries(byMonth)
          .map(([month, amount]) => ({ month, amount }))
          .sort((a, b) => a.month.localeCompare(b.month)),
        byFreelancer: Object.entries(byFreelancer)
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => b.amount - a.amount),
        projectedRevenue: totalRevenue * 1.2, // Simple projection
        collectionRate: 85, // Placeholder
      };
    } catch (error) {
      console.error("Error generating revenue analysis report:", error);
      throw new AppError(
        "INTERNAL_ERROR",
        "Failed to generate revenue analysis report"
      );
    }
  }

  async generateFreelancerPerformanceReport(): Promise<FreelancerPerformanceReport> {
    try {
      // Get all freelancers with their stats
      const { data: freelancers } = await this.supabase
        .from("profiles")
        .select("id, full_name, email, last_active")
        .eq("role", "freelancer");

      if (!freelancers) {
        return { freelancers: [], rankings: { byStudents: [], byRevenue: [], byConversion: [] } };
      }

      const freelancerStats = await Promise.all(
        freelancers.map(async (freelancer) => {
          // Get student count
          const { count: studentCount } = await this.supabase
            .from("students")
            .select("*", { count: "exact", head: true })
            .eq("freelancer_id", freelancer.id);

          // Get applications
          const { data: applications } = await this.supabase
            .from("applications")
            .select("status, commission_amount")
            .eq("student_id", freelancer.id);

          const totalApps = applications?.length || 0;
          const enrollments = applications?.filter((a) => a.status === "enrolled").length || 0;
          const revenue = applications?.reduce((sum, a) => sum + (a.commission_amount || 0), 0) || 0;

          return {
            id: freelancer.id,
            name: freelancer.full_name,
            email: freelancer.email,
            totalStudents: studentCount || 0,
            totalApplications: totalApps,
            enrollments,
            conversionRate: totalApps > 0 ? (enrollments / totalApps) * 100 : 0,
            revenue,
            avgResponseTime: 0, // Would need activity log data
            lastActive: freelancer.last_active || new Date().toISOString(),
          };
        })
      );

      // Calculate rankings
      const byStudents = [...freelancerStats]
        .sort((a, b) => b.totalStudents - a.totalStudents)
        .slice(0, 10)
        .map((f) => ({ id: f.id, name: f.name, value: f.totalStudents }));

      const byRevenue = [...freelancerStats]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
        .map((f) => ({ id: f.id, name: f.name, value: f.revenue }));

      const byConversion = [...freelancerStats]
        .filter((f) => f.totalApplications > 0)
        .sort((a, b) => b.conversionRate - a.conversionRate)
        .slice(0, 10)
        .map((f) => ({ id: f.id, name: f.name, value: f.conversionRate }));

      return {
        freelancers: freelancerStats,
        rankings: { byStudents, byRevenue, byConversion },
      };
    } catch (error) {
      console.error("Error generating freelancer performance report:", error);
      throw new AppError(
        "INTERNAL_ERROR",
        "Failed to generate freelancer performance report"
      );
    }
  }

  async generateDocumentStatusReport(): Promise<DocumentStatusReport> {
    try {
      const { data: documents, count } = await this.supabase
        .from("student_documents")
        .select("*", { count: "exact" });

      if (!documents) {
        return {
          totalDocuments: 0,
          byStatus: {},
          byType: {},
          pendingReview: 0,
          expiredDocuments: 0,
          expiringSoon: 0,
          uploadTrend: [],
        };
      }

      const byStatus: Record<string, number> = {};
      const byType: Record<string, number> = {};
      const byMonth: Record<string, number> = {};
      let pendingReview = 0;
      let expiredDocuments = 0;
      let expiringSoon = 0;

      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      documents.forEach((doc) => {
        // By status
        byStatus[doc.status] = (byStatus[doc.status] || 0) + 1;

        // By type
        byType[doc.doc_type] = (byType[doc.doc_type] || 0) + 1;

        // Pending review
        if (doc.status === "under_review") {
          pendingReview++;
        }

        // Expired
        if (doc.expiry_date && new Date(doc.expiry_date) < now) {
          expiredDocuments++;
        }

        // Expiring soon
        if (doc.expiry_date) {
          const expiry = new Date(doc.expiry_date);
          if (expiry > now && expiry <= thirtyDaysFromNow) {
            expiringSoon++;
          }
        }

        // By month
        const month = new Date(doc.created_at).toISOString().slice(0, 7);
        byMonth[month] = (byMonth[month] || 0) + 1;
      });

      return {
        totalDocuments: count || 0,
        byStatus,
        byType,
        pendingReview,
        expiredDocuments,
        expiringSoon,
        uploadTrend: Object.entries(byMonth)
          .map(([month, count]) => ({ month, count }))
          .sort((a, b) => a.month.localeCompare(b.month)),
      };
    } catch (error) {
      console.error("Error generating document status report:", error);
      throw new AppError(
        "INTERNAL_ERROR",
        "Failed to generate document status report"
      );
    }
  }

  async generateStatusTransitionReport(filters?: ReportFilters): Promise<StatusTransitionReport> {
    try {
      let query = this.supabase
        .from("status_history")
        .select("*")
        .eq("entity_type", "application");

      if (filters?.startDate) {
        query = query.gte("created_at", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("created_at", filters.endDate);
      }

      const { data: transitions } = await query;

      if (!transitions) {
        return {
          totalTransitions: 0,
          byTransition: [],
          mostCommonPaths: [],
        };
      }

      // Group by transition
      const byTransition: Record<string, { from: string; to: string; count: number; times: number[] }> = {};
      
      transitions.forEach((t) => {
        const key = `${t.old_status || "null"}->${t.new_status}`;
        if (!byTransition[key]) {
          byTransition[key] = {
            from: t.old_status || "null",
            to: t.new_status,
            count: 0,
            times: [],
          };
        }
        byTransition[key].count++;
      });

      // Calculate most common paths
      const pathCounts: Record<string, number> = {};
      transitions.forEach((t) => {
        const path = `${t.old_status || "start"} -> ${t.new_status}`;
        pathCounts[path] = (pathCounts[path] || 0) + 1;
      });

      const mostCommonPaths = Object.entries(pathCounts)
        .map(([path, count]) => ({
          path,
          count,
          successRate: 0, // Would need more context
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalTransitions: transitions.length,
        byTransition: Object.values(byTransition).map((t) => ({
          from: t.from,
          to: t.to,
          count: t.count,
          avgTime: 0, // Would need timestamps
        })),
        mostCommonPaths,
      };
    } catch (error) {
      console.error("Error generating status transition report:", error);
      throw new AppError(
        "INTERNAL_ERROR",
        "Failed to generate status transition report"
      );
    }
  }

  async exportReportToCSV(reportType: ReportType, filters?: ReportFilters): Promise<string> {
    const report = await this.generateReport(reportType, filters);
    // Convert to CSV format
    return this.convertToCSV(report);
  }

  async generateReport(type: ReportType, filters?: ReportFilters): Promise<any> {
    switch (type) {
      case "student_summary":
        return this.generateStudentSummaryReport(filters);
      case "application_pipeline":
        return this.generateApplicationPipelineReport(filters);
      case "conversion_funnel":
        return this.generateConversionFunnelReport(filters);
      case "revenue_analysis":
        return this.generateRevenueAnalysisReport(filters);
      case "freelancer_performance":
        return this.generateFreelancerPerformanceReport();
      case "document_status":
        return this.generateDocumentStatusReport();
      case "status_transitions":
        return this.generateStatusTransitionReport(filters);
      default:
        throw new AppError("VALIDATION_ERROR", "Invalid report type");
    }
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion - would need more sophisticated implementation
    return JSON.stringify(data);
  }
}

export const reportingService = new ReportingService();
