import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST - Accept a task assignment
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    // Check if assignment exists
    const { data: assignment, error: assignmentError } = await supabase
      .from("task_assignments")
      .select("*")
      .eq("task_id", taskId)
      .eq("freelancer_id", session.user.id)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: "Task assignment not found" },
        { status: 404 }
      );
    }

    if (assignment.status !== "assigned") {
      return NextResponse.json(
        { error: "Task already accepted or in progress" },
        { status: 400 }
      );
    }

    // Update assignment status
    const { error: updateAssignmentError } = await supabase
      .from("task_assignments")
      .update({ status: "accepted" })
      .eq("id", assignment.id);

    if (updateAssignmentError) {
      console.error("Error updating assignment:", updateAssignmentError);
      return NextResponse.json(
        { error: "Failed to accept task" },
        { status: 500 }
      );
    }

    // Create or update submission with accepted_at
    const { data: existingSubmission } = await supabase
      .from("task_submissions")
      .select("id")
      .eq("task_id", taskId)
      .eq("freelancer_id", session.user.id)
      .maybeSingle();

    if (existingSubmission) {
      await supabase
        .from("task_submissions")
        .update({
          status: "in_progress",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", existingSubmission.id);
    } else {
      const { error: submissionError } = await supabase
        .from("task_submissions")
        .insert({
          task_id: taskId,
          freelancer_id: session.user.id,
          status: "in_progress",
          accepted_at: new Date().toISOString(),
          submission_data: {},
          proof_files: [],
          deadline_extension_requested: false,
        });

      if (submissionError) {
        console.error("Error creating submission:", submissionError);
      }
    }

    // Get task and freelancer info for notification
    const { data: task } = await supabase
      .from("tasks")
      .select("title")
      .eq("id", taskId)
      .single();

    if (!task) {
      console.warn(`Task not found for notification: ${taskId}`);
    }

    const { data: freelancer } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", session.user.id)
      .single();

    // Notify admins
    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .in("role", ["admin", "super_admin"]);

    if (admins && admins.length > 0) {
      const notifications = admins.map((admin) => ({
        freelancer_id: admin.id,
        type: "task_accepted",
        title: "Task Accepted 📝",
        message: `Task "${task?.title || "Unknown Task"}" has been accepted by ${freelancer?.full_name || "a freelancer"}.`,
        is_read: false,
        link: "/admin/tasks",
      }));

      await supabase.from("notifications").insert(notifications);
    }

    return NextResponse.json({
      success: true,
      message: "Task accepted successfully",
    });
  } catch (error) {
    console.error("Accept task API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
