import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET - Get all tasks with assignments and submissions overview
export async function GET(request: Request) {
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
    const status = searchParams.get("status") || "all";
    const priority = searchParams.get("priority") || "all";
    const search = searchParams.get("search") || "";

    // Get all tasks
    let tasksQuery = supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (status === "active") {
      tasksQuery = tasksQuery.eq("is_active", true);
    } else if (status === "inactive") {
      tasksQuery = tasksQuery.eq("is_active", false);
    }

    if (priority !== "all") {
      tasksQuery = tasksQuery.eq("priority", priority);
    }

    const { data: tasks, error: tasksError } = await tasksQuery;

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
      return NextResponse.json(
        { error: "Failed to fetch tasks" },
        { status: 500 }
      );
    }

    // Filter by search
    let filteredTasks = tasks || [];
    if (search) {
      const searchLower = search.toLowerCase();
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.title?.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower) ||
          task.category?.toLowerCase().includes(searchLower)
      );
    }

    // Get all assignments
    const taskIds = filteredTasks.map((t) => t.id);
    const { data: assignments, error: assignmentsError } = await supabase
      .from("task_assignments")
      .select(
        `
        *,
        freelancer:profiles(id, full_name, email, avatar_url)
      `
      )
      .in("task_id", taskIds.length > 0 ? taskIds : ["no-tasks"]);

    if (assignmentsError) {
      console.error("Error fetching assignments:", assignmentsError);
    }

    // Get all submissions
    const { data: submissions, error: submissionsError } = await supabase
      .from("task_submissions")
      .select(
        `
        *,
        freelancer:profiles(id, full_name, email, avatar_url)
      `
      )
      .in("task_id", taskIds.length > 0 ? taskIds : ["no-tasks"]);

    if (submissionsError) {
      console.error("Error fetching submissions:", submissionsError);
    }

    // Combine data
    const tasksWithDetails = filteredTasks.map((task) => {
      const taskAssignments = (assignments || []).filter((a) => a.task_id === task.id);
      const taskSubmissions = (submissions || []).filter((s) => s.task_id === task.id);

      return {
        ...task,
        assignments: taskAssignments,
        submissions: taskSubmissions,
        stats: {
          totalAssigned: taskAssignments.length,
          accepted: taskAssignments.filter((a) => a.status === "accepted" || a.status === "in_progress").length,
          pending: taskSubmissions.filter((s) => s.status === "submitted").length,
          approved: taskSubmissions.filter((s) => s.status === "approved").length,
          rejected: taskSubmissions.filter((s) => s.status === "rejected").length,
        },
      };
    });

    // Calculate overall stats
    const stats = {
      totalTasks: filteredTasks.length,
      activeTasks: filteredTasks.filter((t) => t.is_active).length,
      totalAssignments: assignments?.length || 0,
      pendingSubmissions: submissions?.filter((s) => s.status === "submitted").length || 0,
      completedSubmissions: submissions?.filter((s) => s.status === "approved").length || 0,
      totalRewards: submissions
        ?.filter((s) => s.status === "approved" && s.reward_credited)
        .reduce((sum, s) => {
          const task = filteredTasks.find((t) => t.id === s.task_id);
          return sum + (task?.reward_amount || 0);
        }, 0) || 0,
    };

    return NextResponse.json({
      tasks: tasksWithDetails,
      stats,
    });
  } catch (error) {
    console.error("Tasks overview API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
