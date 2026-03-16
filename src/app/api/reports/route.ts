import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { reportingService, ReportType, ReportFilters } from "@/lib/services/reporting-service";
import { AppError } from "@/lib/utils/error";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  type: z.enum([
    "student_summary",
    "application_pipeline",
    "conversion_funnel",
    "revenue_analysis",
    "freelancer_performance",
    "document_status",
    "status_transitions"
  ]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  freelancerId: z.string().uuid().optional(),
  status: z.array(z.string()).optional(),
  universityId: z.string().uuid().optional(),
  programId: z.string().uuid().optional(),
});

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Get user profile for RBAC
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Profile not found" } },
        { status: 404 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      type: searchParams.get("type"),
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      freelancerId: searchParams.get("freelancerId") || undefined,
      status: searchParams.getAll("status").length > 0 ? searchParams.getAll("status") : undefined,
      universityId: searchParams.get("universityId") || undefined,
      programId: searchParams.get("programId") || undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: "VALIDATION_ERROR", 
            message: "Invalid query parameters",
            details: queryResult.error.flatten().fieldErrors 
          } 
        },
        { status: 400 }
      );
    }

    const { type, ...filters } = queryResult.data;

    // Permissions check: Freelancers can only see their own reports
    const isElevated = ["admin", "super_admin", "manager"].includes(profile.role);
    const finalFilters: ReportFilters = {
      ...filters,
      freelancerId: isElevated ? filters.freelancerId : user.id
    };

    const reportData = await reportingService.generateReport(type as ReportType, finalFilters);

    return NextResponse.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error("Error generating report:", error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode || 500 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to generate report" } },
      { status: 500 }
    );
  }
}
