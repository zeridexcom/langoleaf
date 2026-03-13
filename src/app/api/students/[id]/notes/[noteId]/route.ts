import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/students/[id]/notes/[noteId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, category, isPinned } = body;

    // Verify note belongs to user
    const { data: existingNote } = await supabase
      .from("student_notes")
      .select("id, author_id")
      .eq("id", params.noteId)
      .eq("student_id", params.id)
      .single();

    if (!existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (existingNote.author_id !== user.id) {
      return NextResponse.json(
        { error: "Can only edit your own notes" },
        { status: 403 }
      );
    }

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (content !== undefined) updates.content = content.trim();
    if (category !== undefined) updates.category = category;
    if (isPinned !== undefined) updates.is_pinned = isPinned;

    const { data: note, error } = await supabase
      .from("student_notes")
      .update(updates)
      .eq("id", params.noteId)
      .select(`
        id,
        content,
        is_pinned,
        category,
        created_at,
        updated_at,
        author_id,
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
          id: profile?.id || note.author_id,
          name: profile?.full_name || "Unknown",
          avatar: profile?.avatar_url,
        },
      },
    });
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    );
  }
}

// DELETE /api/students/[id]/notes/[noteId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify note belongs to user
    const { data: existingNote } = await supabase
      .from("student_notes")
      .select("id, author_id")
      .eq("id", params.noteId)
      .eq("student_id", params.id)
      .single();

    if (!existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (existingNote.author_id !== user.id) {
      return NextResponse.json(
        { error: "Can only delete your own notes" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("student_notes")
      .delete()
      .eq("id", params.noteId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
}
