import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET - Fetch submissions with filters or fetch all tasks
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
    const fetchType = searchParams.get("fetchType") || "submissions"; // 'submissions' or 'tasks'
    const status = searchParams.get("status") || "all";
    const taskType = searchParams.get("taskType") || "all";
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Fetch all tasks
    if (fetchType === "tasks") {
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (tasksError) {
        console.error("Error fetching tasks:", tasksError);
        return NextResponse.json(
          { error: "Failed to fetch tasks" },
          { status: 500 }
        );
      }

      return NextResponse.json({ tasks: tasks || [] });
    }

    // Fetch submissions with filters
    let query = supabase
      .from("task_submissions")
      .select(
        `
        *,
        task:tasks(*),
        freelancer:profiles!task_submissions_freelancer_id_fkey(id, full_name, email, avatar_url)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    // Apply status filter
    if (status !== "all") {
      query = query.eq("status", status);
    }

    // Apply task type filter - need to fetch task IDs first
    if (taskType !== "all") {
      const { data: taskIds } = await supabase
        .from("tasks")
        .select("id")
        .eq("type", taskType);
      
      if (taskIds && taskIds.length > 0) {
        const ids = taskIds.map(t => t.id);
        query = query.in("task_id", ids);
      } else {
        // No tasks of this type, return empty with stats
        const { data: statsData } = await supabase
          .from("task_submissions")
          .select("status, task:tasks(reward_amount)");

        const stats = {
          total: statsData?.length || 0,
          pending: statsData?.filter((s: any) => s.status === "submitted").length || 0,
          approved: statsData?.filter((s: any) => s.status === "approved").length || 0,
          rejected: statsData?.filter((s: any) => s.status === "rejected").length || 0,
          totalRewards: statsData
            ?.filter((s: any) => s.status === "approved")
            .reduce((sum: number, s: any) => sum + (s.task?.reward_amount || 0), 0) || 0,
        };

        return NextResponse.json({ 
          submissions: [], 
          total: 0,
          page,
          totalPages: 0,
          stats
        });
      }
    }

    // Apply date range filter
    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }
    if (dateTo) {
      query = query.lte("created_at", dateTo + "T23:59:59");
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching submissions:", error);
      return NextResponse.json(
        { error: "Failed to fetch submissions" },
        { status: 500 }
      );
    }

    // Apply search filter in memory (for name/email search)
    let filteredData = data || [];
    if (search) {
      const searchLower = search.toLowerCase();
      filteredData = filteredData.filter((item: any) => 
        item.freelancer?.full_name?.toLowerCase().includes(searchLower) ||
        item.freelancer?.email?.toLowerCase().includes(searchLower) ||
        item.task?.title?.toLowerCase().includes(searchLower)
      );
    }

    // Get stats
    const { data: statsData } = await supabase
      .from("task_submissions")
      .select("status, task:tasks(reward_amount)");

    const stats = {
      total: statsData?.length || 0,
      pending: statsData?.filter((s: any) => s.status === "submitted").length || 0,
      approved: statsData?.filter((s: any) => s.status === "approved").length || 0,
      rejected: statsData?.filter((s: any) => s.status === "rejected").length || 0,
      totalRewards: statsData
        ?.filter((s: any) => s.status === "approved")
        .reduce((sum: number, s: any) => sum + (s.task?.reward_amount || 0), 0) || 0,
    };

    return NextResponse.json({ 
      submissions: filteredData, 
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
      stats
    });
  } catch (error) {
    console.error("Admin tasks API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new task or bulk verify submissions
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
    
    // Check if this is a bulk operation
    if (body.action === "bulk_approve" || body.action === "bulk_reject") {
      const { submissionIds, action, reason } = body;

      if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
        return NextResponse.json(
          { error: "Submission IDs are required for bulk operations" },
          { status: 400 }
        );
      }

      const newStatus = action === "bulk_approve" ? "approved" : "rejected";
      const results = { success: 0, failed: 0 };

      for (const submissionId of submissionIds) {
        try {
          // Get submission details
          const { data: submission, error: fetchError } = await supabase
            .from("task_submissions")
            .select(`*, task:tasks(*)`)
            .eq("id", submissionId)
            .single();

          if (fetchError || !submission) {
            results.failed++;
            continue;
          }

          const task = submission.task as any;

          // Update submission status
          const { error: updateError } = await supabase
            .from("task_submissions")
            .update({
              status: newStatus,
              reviewed_by: session.user.id,
              reviewed_at: new Date().toISOString(),
              review_notes: action === "bulk_reject" ? reason : null,
              reward_credited: action === "bulk_approve",
            })
            .eq("id", submissionId);

          if (updateError) {
            results.failed++;
            continue;
          }

          // Credit reward if approved
          if (action === "bulk_approve" && task?.reward_amount > 0) {
            try {
              await supabase.rpc("award_coins", {
                profile_id: submission.freelancer_id,
                amount: task.reward_amount,
                reason: `Task completed: ${task.title}`,
              });
            } catch (coinError) {
              console.error("Failed to credit coins:", coinError);
            }
          }

          // Create notification
          await supabase.from("notifications").insert({
            freelancer_id: submission.freelancer_id,
            type: action === "bulk_approve" ? "task_approved" : "task_rejected",
            title: action === "bulk_approve" ? "Task Approved! 🎉" : "Task Submission Rejected",
            message:
              action === "bulk_approve"
                ? `Your ${task?.title || "task"} submission has been approved. ₹${task?.reward_amount || 0} credited!`
                : `Your ${task?.title || "task"} submission was rejected. ${reason ? `Reason: ${reason}` : ""}`,
            is_read: false,
          });

          results.success++;
        } catch (err) {
          results.failed++;
        }
      }

      return NextResponse.json({
        success: true,
        results,
        message: `Processed ${results.success} submissions successfully, ${results.failed} failed`,
      });
    }

    // Regular task creation
    const { type, title, description, reward_amount, target_url, auto_assign } = body;

    if (!type || !title || reward_amount === undefined) {
      return NextResponse.json(
        { error: "Type, title, and reward amount are required" },
        { status: 400 }
      );
    }

    // Create task
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .insert({
        type,
        title,
        description,
        reward_amount,
        reward_currency: "INR",
        target_url,
        auto_assign: auto_assign ?? true,
        is_active: true,
      })
      .select()
      .single();

    if (taskError) {
      console.error("Error creating task:", taskError);
      return NextResponse.json(
        { error: "Failed to create task" },
        { status: 500 }
      );
    }

    // If auto_assign, notify all freelancers
    if (auto_assign) {
      const { data: freelancers } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "freelancer");

      if (freelancers && freelancers.length > 0) {
        const notifications = freelancers.map((f: any) => ({
          freelancer_id: f.id,
          type: "task_assigned",
          title: "New Task Available! 📋",
          message: `A new task "${title}" is available. Complete it to earn ₹${reward_amount}!`,
          is_read: false,
          link: `/tasks/${type.replace("_", "-")}`,
        }));

        await supabase.from("notifications").insert(notifications);
      }
    }

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("Create task API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update an existing task
export async function PUT(request: Request) {
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
    const { id, type, title, description, reward_amount, target_url, auto_assign, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    // Update task
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .update({
        type,
        title,
        description,
        reward_amount,
        target_url,
        auto_assign,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (taskError) {
      console.error("Error updating task:", taskError);
      return NextResponse.json(
        { error: "Failed to update task" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("Update task API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a task
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    // Check if task has submissions
    const { data: submissions } = await supabase
      .from("task_submissions")
      .select("id")
      .eq("task_id", id)
      .limit(1);

    if (submissions && submissions.length > 0) {
      // Soft delete by setting is_active to false instead of hard delete
      const { error: updateError } = await supabase
        .from("tasks")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (updateError) {
        console.error("Error deactivating task:", updateError);
        return NextResponse.json(
          { error: "Failed to deactivate task" },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        message: "Task deactivated (has submissions)" 
      });
    }

    // Hard delete if no submissions
    const { error: deleteError } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting task:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete task" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Task deleted" });
  } catch (error) {
    console.error("Delete task API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
