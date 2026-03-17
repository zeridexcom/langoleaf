import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET - Fetch user's task submissions
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from("task_submissions")
      .select(
        `
        *,
        task:tasks(*)
      `
      )
      .eq("freelancer_id", session.user.id)
      .order("created_at", { ascending: false });

    if (taskId) {
      query = query.eq("task_id", taskId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching submissions:", error);
      return NextResponse.json(
        { error: "Failed to fetch submissions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ submissions: data || [] });
  } catch (error) {
    console.error("Submissions API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Submit a task
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
    const { task_id, submission_data } = body;

    if (!task_id || !submission_data?.review_link) {
      return NextResponse.json(
        { error: "Task ID and review link are required" },
        { status: 400 }
      );
    }

    // Check for existing pending submission
    const { data: existing, error: checkError } = await supabase
      .from("task_submissions")
      .select("*")
      .eq("task_id", task_id)
      .eq("freelancer_id", session.user.id)
      .in("status", ["pending", "submitted"])
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing:", checkError);
    }

    if (existing) {
      return NextResponse.json(
        { error: "You already have a pending submission for this task" },
        { status: 400 }
      );
    }

    // Create submission
    const { data, error } = await supabase
      .from("task_submissions")
      .insert({
        task_id,
        freelancer_id: session.user.id,
        submission_data,
        status: "submitted",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating submission:", error);
      return NextResponse.json(
        { error: "Failed to submit task" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, submission: data });
  } catch (error) {
    console.error("Submit task API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
