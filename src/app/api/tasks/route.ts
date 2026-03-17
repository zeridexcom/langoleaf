import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET - Fetch tasks for the current user
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all active tasks
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
      return NextResponse.json(
        { error: "Failed to fetch tasks" },
        { status: 500 }
      );
    }

    // Get user's submissions
    const { data: submissions, error: submissionsError } = await supabase
      .from("task_submissions")
      .select("*")
      .eq("freelancer_id", session.user.id);

    if (submissionsError) {
      console.error("Error fetching submissions:", submissionsError);
    }

    // Map tasks with submission status
    const tasksWithStatus = (tasks || []).map((task) => {
      const submission = (submissions || []).find(
        (s) => s.task_id === task.id
      );
      return {
        ...task,
        hasSubmitted: !!submission,
        submission: submission || null,
      };
    });

    // Calculate pending count
    const pendingCount = tasksWithStatus.filter(
      (t) => !t.hasSubmitted || t.submission?.status === "rejected"
    ).length;

    return NextResponse.json({
      tasks: tasksWithStatus,
      pendingCount,
    });
  } catch (error) {
    console.error("Tasks API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
