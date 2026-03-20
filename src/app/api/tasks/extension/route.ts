import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST - Request deadline extension (freelancer) or review extension (admin)
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
    const { action, submissionId, reason, newDeadline, approved } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: "Submission ID is required" },
        { status: 400 }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get submission
    const { data: submission, error: submissionError } = await supabase
      .from("task_submissions")
      .select(
        `
        *,
        task:tasks(*),
        freelancer:profiles(id, full_name, email)
      `
      )
      .eq("id", submissionId)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Freelancer requesting extension
    if (action === "request") {
      if (profile.role !== "freelancer") {
        return NextResponse.json(
          { error: "Only freelancers can request extensions" },
          { status: 403 }
        );
      }

      if (submission.freelancer_id !== session.user.id) {
        return NextResponse.json(
          { error: "You can only request extension for your own tasks" },
          { status: 403 }
        );
      }

      if (!reason || !newDeadline) {
        return NextResponse.json(
          { error: "Reason and new deadline are required" },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("task_submissions")
        .update({
          deadline_extension_requested: true,
          deadline_extension_reason: reason,
          new_deadline: newDeadline,
        })
        .eq("id", submissionId)
        .select()
        .single();

      if (error) {
        console.error("Error requesting extension:", error);
        return NextResponse.json(
          { error: "Failed to request extension" },
          { status: 500 }
        );
      }

      // Notify admins
      const task = submission.task as any;
      const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .in("role", ["admin", "super_admin"]);

      if (admins && admins.length > 0) {
        const notifications = admins.map((admin) => ({
          freelancer_id: admin.id,
          type: "deadline_extension_request",
          title: "New Extension Request! ⏰",
          message: `Update for task "${task.title}". New reason: "${reason}"`,
          is_read: false,
          link: "/admin/tasks",
        }));

        await supabase.from("notifications").insert(notifications);
      }

      // Notify freelancer that their request has been sent
      await supabase.from("notifications").insert({
        freelancer_id: session.user.id, // Freelancer is the recipient
        type: "deadline_extension_request",
        title: "Extension Request Sent ⏰",
        message: `Your extension request for "${task.title}" has been sent for review.`,
        is_read: false,
        link: "/tasks",
      });

      return NextResponse.json({
        success: true,
        message: "Extension request submitted",
        submission: data,
      });
    }

    // Admin reviewing extension
    if (action === "review") {
      if (!["admin", "super_admin"].includes(profile.role)) {
        return NextResponse.json(
          { error: "Only admins can review extensions" },
          { status: 403 }
        );
      }

      if (typeof approved !== "boolean") {
        return NextResponse.json(
          { error: "Approved status is required" },
          { status: 400 }
        );
      }

      const updateData: any = {
        deadline_extension_approved: approved,
      };

      if (approved) {
        updateData.deadline_extension_requested = false;
        // If approved, update the actual deadline
        if (submission.new_deadline) {
          updateData.deadline = submission.new_deadline;
        }
      } else {
        // If rejected, clear the request fields
        updateData.deadline_extension_requested = false;
        updateData.deadline_extension_reason = null;
        updateData.new_deadline = null;
      }

      const { data, error } = await supabase
        .from("task_submissions")
        .update(updateData)
        .eq("id", submissionId)
        .select()
        .single();

      if (error) {
        console.error("Error reviewing extension:", error);
        return NextResponse.json(
          { error: "Failed to review extension" },
          { status: 500 }
        );
      }

      // Notify freelancer
      const task = submission.task as any;
      await supabase.from("notifications").insert({
        freelancer_id: submission.freelancer_id, // Freelancer is the recipient
        type: approved ? "deadline_extension_approved" : "deadline_extension_rejected",
        title: approved ? "Extension Approved ✅" : "Extension Rejected ❌",
        message: approved
          ? `Your deadline extension for "${task?.title || "the task"}" has been approved. New deadline: ${submission.new_deadline ? new Date(submission.new_deadline).toLocaleDateString() : "N/A"}`
          : `Your deadline extension request for "${task?.title || "the task"}" was rejected.`,
        is_read: false,
        link: "/tasks",
      });

      return NextResponse.json({
        success: true,
        message: approved ? "Extension approved" : "Extension rejected",
        submission: data,
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Extension API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
