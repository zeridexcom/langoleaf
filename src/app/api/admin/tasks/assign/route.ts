import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST - Assign task to specific freelancers
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { taskId, freelancerIds } = body;

    if (!taskId || !freelancerIds || !Array.isArray(freelancerIds) || freelancerIds.length === 0) {
      return NextResponse.json(
        { error: "Task ID and freelancer IDs are required" },
        { status: 400 }
      );
    }

    // Verify task exists
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, title, reward_amount")
      .eq("id", taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Verify freelancers exist
    const { data: freelancers, error: freelancersError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", freelancerIds)
      .eq("role", "freelancer");

    if (freelancersError) {
      return NextResponse.json(
        { error: "Failed to verify freelancers" },
        { status: 500 }
      );
    }

    const validFreelancerIds = freelancers?.map((f) => f.id) || [];

    if (validFreelancerIds.length === 0) {
      return NextResponse.json(
        { error: "No valid freelancers found" },
        { status: 400 }
      );
    }

    // Check for existing assignments
    const { data: existingAssignments } = await supabase
      .from("task_assignments")
      .select("freelancer_id")
      .eq("task_id", taskId)
      .in("freelancer_id", validFreelancerIds);

    const existingFreelancerIds = existingAssignments?.map((a) => a.freelancer_id) || [];
    const newFreelancerIds = validFreelancerIds.filter(
      (id) => !existingFreelancerIds.includes(id)
    );

    if (newFreelancerIds.length === 0) {
      return NextResponse.json(
        { error: "All selected freelancers are already assigned to this task" },
        { status: 400 }
      );
    }

    // Create assignments
    const assignments = newFreelancerIds.map((freelancerId) => ({
      task_id: taskId,
      freelancer_id: freelancerId,
      assigned_by: session.user.id,
      status: "assigned",
    }));

    const { data: insertedAssignments, error: insertError } = await supabase
      .from("task_assignments")
      .insert(assignments)
      .select(
        `
        *,
        freelancer:profiles(id, full_name, email, avatar_url)
      `
      );

    if (insertError) {
      console.error("Error creating assignments:", insertError);
      return NextResponse.json(
        { error: "Failed to create assignments" },
        { status: 500 }
      );
    }

    // Create notifications for newly assigned freelancers
    const notifications = newFreelancerIds.map((freelancerId) => ({
      user_id: freelancerId,
      type: "task_assigned",
      title: "New Task Assigned! 📋",
      message: `You have been assigned a new task "${task.title}". Complete it to earn ₹${task.reward_amount}!`,
      is_read: false,
      link: "/tasks",
    }));

    await supabase.from("notifications").insert(notifications);

    return NextResponse.json({
      success: true,
      assignments: insertedAssignments,
      skipped: existingFreelancerIds.length,
      assigned: newFreelancerIds.length,
    });
  } catch (error) {
    console.error("Assign task API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get task assignments
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    const { data: assignments, error } = await supabase
      .from("task_assignments")
      .select(
        `
        *,
        task:tasks(*),
        freelancer:profiles(id, full_name, email, avatar_url)
      `
      )
      .eq("task_id", taskId)
      .order("assigned_at", { ascending: false });

    if (error) {
      console.error("Error fetching assignments:", error);
      return NextResponse.json(
        { error: "Failed to fetch assignments" },
        { status: 500 }
      );
    }

    return NextResponse.json({ assignments: assignments || [] });
  } catch (error) {
    console.error("Get assignments API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove assignment
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get("id");

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("task_assignments")
      .delete()
      .eq("id", assignmentId);

    if (error) {
      console.error("Error deleting assignment:", error);
      return NextResponse.json(
        { error: "Failed to delete assignment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete assignment API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
