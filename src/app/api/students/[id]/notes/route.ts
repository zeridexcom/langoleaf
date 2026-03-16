import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/students/[id]/notes
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify student belongs to user
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("id", params.id)
      .eq("freelancer_id", user.id)
      .single();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const { data: notes, error } = await supabase
      .from("student_notes")
      .select(`
        id,
        content,
        is_pinned,
        category,
        created_at,
        updated_at,
        profiles:author_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq("student_id", params.id)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const transformedNotes = notes?.map((note: any) => {
      const profile = Array.isArray(note.profiles) ? note.profiles[0] : note.profiles;
      return {
        id: note.id,
        content: note.content,
        isPinned: note.is_pinned,
        category: note.category,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
        author: {
          id: profile?.id || note.author_id,
          name: profile?.full_name || "Unknown",
          avatar: profile?.avatar_url,
        },
      };
    }) || [];

    return NextResponse.json({ notes: transformedNotes });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

// POST /api/students/[id]/notes
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, category = "general" } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Verify student belongs to user
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("id", params.id)
      .eq("freelancer_id", user.id)
      .single();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const { data: note, error } = await supabase
      .from("student_notes")
      .insert({
        student_id: params.id,
        author_id: user.id,
        content: content.trim(),
        category,
      })
      .select(`
        id,
        content,
        is_pinned,
        category,
        created_at,
        updated_at,
        profiles:author_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    // Log activity
    await supabase.rpc("log_student_activity", {
      p_freelancer_id: user.id,
      p_action: "note_added",
      p_entity_type: "note",
      p_entity_id: note.id,
      p_student_id: params.id,
      p_details: { note_preview: content.substring(0, 100) },
    });

    const profile = Array.isArray(note.profiles) ? note.profiles[0] : note.profiles;

    return NextResponse.json({
      note: {
        id: note.id,
        content: note.content,
        isPinned: note.is_pinned,
        category: note.category,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
        author: {
          id: profile?.id || user.id,
          name: profile?.full_name || "You",
          avatar: profile?.avatar_url,
        },
      },
    });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}
