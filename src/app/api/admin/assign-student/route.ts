import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { studentId, newFreelancerId, reason, isTransfer } = body;

    if (!studentId || !newFreelancerId) {
      return NextResponse.json(
        { error: "Missing required fields: studentId and newFreelancerId" },
        { status: 400 }
      );
    }

    // Use the appropriate RPC function based on whether it's a transfer or assignment
    let result;
    if (isTransfer) {
      // Use transfer function
      const { data, error } = await supabase.rpc("transfer_student_ownership", {
        p_student_id: studentId,
        p_new_freelancer_id: newFreelancerId,
        p_reason: reason || null,
      });

      if (error) {
        console.error("Transfer error:", error);
        return NextResponse.json(
          { error: "Failed to transfer student: " + error.message },
          { status: 500 }
        );
      }

      result = { success: true, transferred: data };
    } else {
      // Use assign function
      const { data, error } = await supabase.rpc("assign_student_to_freelancer", {
        p_student_id: studentId,
        p_freelancer_id: newFreelancerId,
        p_notes: reason || null,
      });

      if (error) {
        console.error("Assignment error:", error);
        return NextResponse.json(
          { error: "Failed to assign student: " + error.message },
          { status: 500 }
        );
      }

      result = { success: true, assigned: data };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin assign student API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
