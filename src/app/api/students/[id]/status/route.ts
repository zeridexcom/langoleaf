import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST /api/students/[id]/status
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status: newStatus, reason } = body;

    if (!newStatus) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Get current student status
    const { data: student } = await supabase
      .from("students")
      .select("id, status")
      .eq("id", params.id)
      .eq("freelancer_id", user.id)
      .single();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const oldStatus = student.status;

    // Update student status
    const { error: updateError } = await supabase
      .from("students")
      .update({ status: newStatus })
      .eq("id", params.id);

    if (updateError) {
      throw updateError;
    }

    // Track status change (this will also log activity via trigger)
    const { data: statusChange, error: historyError } = await supabase
      .from("student_status_history")
      .insert({
        student_id: params.id,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by: user.id,
        reason: reason || null,
      })
      .select(`
        id,
        old_status,
        new_status,
        reason,
        created_at,
        profiles:changed_by (
          full_name,
          avatar_url
        )
      `)
      .single();

    if (historyError) {
      throw historyError;
    }

    const profile = Array.isArray(statusChange.profiles) 
      ? statusChange.profiles[0] 
      : statusChange.profiles;

    return NextResponse.json({
      statusChange: {
        id: statusChange.id,
        oldStatus: statusChange.old_status,
        newStatus: statusChange.new_status,
        reason: statusChange.reason,
        createdAt: statusChange.created_at,
        changedBy: {
          name: profile?.full_name || "Unknown",
          avatar: profile?.avatar_url,
        },
      },
    });
  } catch (error) {
    console.error("Error changing status:", error);
    return NextResponse.json(
      { error: "Failed to change status" },
      { status: 500 }
    );
  }
}

// GET /api/students/[id]/status/history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify student belongs to user
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("id", params.id)
      .eq("freelancer_id", user.id)
      .single();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const { data: history, error } = await supabase
      .from("student_status_history")
      .select(`
        id,
        old_status,
        new_status,
        reason,
        created_at,
        profiles:changed_by (
          full_name,
          avatar_url
        )
      `)
      .eq("student_id", params.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const transformedHistory = history?.map((item: any) => {
      const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
      return {
        id: item.id,
        oldStatus: item.old_status,
        newStatus: item.new_status,
        reason: item.reason,
        createdAt: item.created_at,
        changedBy: {
          name: profile?.full_name || "Unknown",
          avatar: profile?.avatar_url,
        },
      };
    }) || [];

    return NextResponse.json({ history: transformedHistory });
  } catch (error) {
    console.error("Error fetching status history:", error);
    return NextResponse.json(
      { error: "Failed to fetch status history" },
      { status: 500 }
    );
  }
}
