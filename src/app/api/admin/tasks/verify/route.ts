import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST - Approve or reject a submission
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
    const { submissionId, action, reason } = body;

    if (!submissionId || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Submission ID and valid action are required" },
        { status: 400 }
      );
    }

    // Get submission details
    const { data: submission, error: fetchError } = await supabase
      .from("task_submissions")
      .select(
        `
        *,
        task:tasks(*)
      `
      )
      .eq("id", submissionId)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    const task = submission.task as any;

    if (action === "approve") {
      // Update submission status
      const { error: updateError } = await supabase
        .from("task_submissions")
        .update({
          status: "approved",
          reviewed_by: session.user.id,
          reviewed_at: new Date().toISOString(),
          reward_credited: true,
        })
        .eq("id", submissionId);

      if (updateError) {
        console.error("Error approving submission:", updateError);
        return NextResponse.json(
          { error: "Failed to approve submission" },
          { status: 500 }
        );
      }

      // Credit reward to freelancer
      if (task && task.reward_amount > 0) {
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
        type: "task_approved",
        title: "Task Approved! 🎉",
        message: `Your submission for "${task?.title || "Task"}" has been approved. ₹${task?.reward_amount || 0} credited!`,
        is_read: false,
      });

      return NextResponse.json({
        success: true,
        message: "Submission approved and reward credited",
      });
    } else {
      // Reject submission
      const { error: updateError } = await supabase
        .from("task_submissions")
        .update({
          status: "rejected",
          reviewed_by: session.user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reason || "Submission rejected",
        })
        .eq("id", submissionId);

      if (updateError) {
        console.error("Error rejecting submission:", updateError);
        return NextResponse.json(
          { error: "Failed to reject submission" },
          { status: 500 }
        );
      }

      // Create notification
      await supabase.from("notifications").insert({
        freelancer_id: submission.freelancer_id,
        type: "task_rejected",
        title: "Task Rejected ❌",
        message: `Your submission for "${task?.title || "Task"}" was rejected. Reason: ${reason}`,
        is_read: false,
      });

      return NextResponse.json({
        success: true,
        message: "Submission rejected",
      });
    }
  } catch (error) {
    console.error("Verify task API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
