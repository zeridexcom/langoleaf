import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET - Fetch all pending submissions (admin only)
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
    const status = searchParams.get("status") || "submitted";

    // Get submissions with task and freelancer details
    const { data, error } = await supabase
      .from("task_submissions")
      .select(
        `
        *,
        task:tasks(*),
        freelancer:profiles!task_submissions_freelancer_id_fkey(id, full_name, email, avatar_url)
      `
      )
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching submissions:", error);
      return NextResponse.json(
        { error: "Failed to fetch submissions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ submissions: data || [] });
  } catch (error) {
    console.error("Admin tasks API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new task (admin only)
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
    const { type, title, description, reward_amount, target_url, auto_assign } = body;

    if (!type || !title || !reward_amount) {
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
        const notifications = freelancers.map((f) => ({
          user_id: f.id,
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
