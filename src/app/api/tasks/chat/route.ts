import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET - Get chat messages for a task
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
    const submissionId = searchParams.get("submissionId");

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    let query = supabase
      .from("task_chats")
      .select(
        `
        *,
        sender:profiles(id, full_name, avatar_url, role)
      `
      )
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (submissionId) {
      query = query.eq("submission_id", submissionId);
    }

    const { data: chats, error } = await query;

    if (error) {
      console.error("Error fetching chats:", error);
      return NextResponse.json(
        { error: "Failed to fetch chats" },
        { status: 500 }
      );
    }

    // Mark messages as read if current user is not the sender
    if (chats && chats.length > 0) {
      const unreadIds = chats
        .filter((chat) => !chat.is_read && chat.sender_id !== session.user.id)
        .map((chat) => chat.id);

      if (unreadIds.length > 0) {
        await supabase
          .from("task_chats")
          .update({ is_read: true })
          .in("id", unreadIds);
      }
    }

    return NextResponse.json({ chats: chats || [] });
  } catch (error) {
    console.error("Get chats API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Send a chat message
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
    const { taskId, submissionId, message, attachments } = body;

    if (!taskId || !message) {
      return NextResponse.json(
        { error: "Task ID and message are required" },
        { status: 400 }
      );
    }

    // Create chat message
    const { data: chat, error: chatError } = await supabase
      .from("task_chats")
      .insert({
        task_id: taskId,
        submission_id: submissionId || null,
        sender_id: session.user.id,
        message,
        attachments: attachments || [],
        is_read: false,
      })
      .select(
        `
        *,
        sender:profiles(id, full_name, avatar_url, role)
      `
      )
      .single();

    if (chatError) {
      console.error("Error creating chat:", chatError);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    // Get sender info
    const { data: sender } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", session.user.id)
      .single();

    // Get task info
    const { data: task } = await supabase
      .from("tasks")
      .select("title")
      .eq("id", taskId)
      .single();

    // Notify the other party
    if (sender?.role === "freelancer") {
      // Notify admins
      const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .in("role", ["admin", "super_admin"]);

      if (admins && admins.length > 0) {
        const notifications = admins.map((admin) => ({
          freelancer_id: admin.id,
          type: "task_chat_message",
          title: "New Message on Task 💬",
          message: `${sender.full_name || "A freelancer"} sent a message on "${task?.title || "a task"}"`,
          is_read: false,
          link: "/admin/tasks",
        }));

        await supabase.from("notifications").insert(notifications);
      }
    } else {
      // Notify freelancer
      if (submissionId) {
        const { data: submission } = await supabase
          .from("task_submissions")
          .select("freelancer_id")
          .eq("id", submissionId)
          .single();

        if (submission) {
          await supabase.from("notifications").insert({
            freelancer_id: submission.freelancer_id,
            type: "task_chat_message",
            title: "New Message on Task 💬",
            message: `Admin replied on "${task?.title || "your task"}"`,
            is_read: false,
            link: "/tasks",
          });
        }
      }
    }

    return NextResponse.json({ success: true, chat });
  } catch (error) {
    console.error("Send chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
