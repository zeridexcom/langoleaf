import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { FinanceService } from "@/lib/services/finance-service";
import { AppError } from "@/lib/utils/error";

export const dynamic = "force-dynamic";

const createPayoutSchema = z.object({
  freelancerId: z.string().uuid(),
  notes: z.string().optional(),
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

    if (!profile) return NextResponse.json({ success: false }, { status: 404 });

    const isElevated = ["admin", "super_admin", "manager"].includes(profile.role);
    
    const { searchParams } = new URL(request.url);
    const freelancerId = searchParams.get("freelancerId") || undefined;

    // Permissions: Managers/Admins can filter by freelancerId, others only see their own
    const targetFreelancerId = isElevated ? freelancerId : user.id;

    let query = supabase
      .from("payouts")
      .select(`
        *,
        freelancer:profiles(id, full_name, email)
      `)
      .order("created_at", { ascending: false });

    if (targetFreelancerId) {
      query = query.eq("freelancer_id", targetFreelancerId);
    }

    const { data: payouts, error } = await query;

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Failed to fetch payouts: " + error.message);
    }

    return NextResponse.json({
      success: true,
      data: payouts,
    });
  } catch (error) {
    console.error("Error fetching payouts:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch payouts" } },
      { status: 500 }
    );
  }
}

// POST /api/finance/payouts - Process a payout (Admin/Manager only)
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false }, { status: 401 });

    // Check permissions
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "super_admin", "manager"].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Only administrators can process payouts" } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createPayoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR" } }, { status: 400 });
    }

    const result = await FinanceService.processPayout(
      validation.data.freelancerId,
      validation.data.notes
    );

    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 201 });
  } catch (error) {
    console.error("Error processing payout:", error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode || 500 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to process payout" } },
      { status: 500 }
    );
  }
}
