import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { FinanceService } from "@/lib/services/finance-service";
import { AppError } from "@/lib/utils/error";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.array(z.string()).optional(),
  freelancerId: z.string().uuid().optional(),
  applicationId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
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

    // Get user profile
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
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      status: searchParams.getAll("status"),
      freelancerId: searchParams.get("freelancerId") || undefined,
      applicationId: searchParams.get("applicationId") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid query parameters" } },
        { status: 400 }
      );
    }

    const { page, limit, status, freelancerId, applicationId, dateFrom, dateTo } = queryResult.data;

    // Permissions check
    const isElevated = ["admin", "super_admin", "manager"].includes(profile.role);
    const targetFreelancerId = isElevated ? (freelancerId || undefined) : user.id;

    const result = await FinanceService.listCommissions(
      {
        status,
        freelancerId: targetFreelancerId,
        applicationId,
        dateFrom,
        dateTo,
      },
      page,
      limit
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching commissions:", error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode || 500 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch commissions" } },
      { status: 500 }
    );
  }
}
