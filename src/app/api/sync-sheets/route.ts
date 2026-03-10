import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ensureSheets,
  addStudentToSheet,
  addApplicationToSheet,
  updateStudentInSheet,
} from "@/lib/google/sheets";

export const dynamic = "force-dynamic";

// POST /api/sync-sheets - Sync a student to Google Sheets
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { studentId, action = "create" } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    // Ensure sheets exist
    const sheetsReady = await ensureSheets();
    if (!sheetsReady) {
      return NextResponse.json(
        { error: "Failed to initialize Google Sheets" },
        { status: 500 }
      );
    }

    // Get student data from database
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("*, applications(*)")
      .eq("id", studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Get documents URL for the student
    const { data: documents } = await supabase
      .from("student_documents")
      .select("url, type")
      .eq("student_id", studentId);

    const documentsUrl = documents
      ? documents.map((d) => `${d.type}: ${d.url}`).join(" | ")
      : "";

    let success = false;

    if (action === "create") {
      // Add new student to sheet
      success = await addStudentToSheet({
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        program: student.program,
        university: student.university,
        status: student.status,
        created_at: student.created_at,
        freelancer_id: student.freelancer_id,
        documents_url: documentsUrl,
        notes: student.notes || "",
      });

      // Also sync applications if any
      if (student.applications && student.applications.length > 0) {
        for (const app of student.applications) {
          await addApplicationToSheet({
            id: app.id,
            student_id: student.id,
            student_name: student.name,
            program: app.program || student.program,
            university: app.university || student.university,
            status: app.status,
            commission_amount: app.commission_amount || 0,
            created_at: app.created_at,
            updated_at: app.updated_at,
            documents: documentsUrl,
          });
        }
      }
    } else if (action === "update") {
      // Update existing student
      success = await updateStudentInSheet(studentId, {
        name: student.name,
        email: student.email,
        phone: student.phone,
        program: student.program,
        university: student.university,
        status: student.status,
        documents_url: documentsUrl,
        notes: student.notes,
      });
    }

    if (success) {
      // Update sync status in database
      await supabase
        .from("students")
        .update({
          sheets_synced_at: new Date().toISOString(),
          sheets_sync_status: "synced",
        })
        .eq("id", studentId);

      return NextResponse.json({
        success: true,
        message: `Student ${action === "create" ? "added to" : "updated in"} Google Sheets`,
      });
    } else {
      return NextResponse.json(
        { error: "Failed to sync to Google Sheets" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in sync-sheets API:", error);
    return NextResponse.json(
      { error: "Failed to sync to Google Sheets" },
      { status: 500 }
    );
  }
}

// GET /api/sync-sheets - Get sync status
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    const { data: student, error } = await supabase
      .from("students")
      .select("sheets_synced_at, sheets_sync_status")
      .eq("id", studentId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      synced: student.sheets_sync_status === "synced",
      syncedAt: student.sheets_synced_at,
      status: student.sheets_sync_status,
    });
  } catch (error) {
    console.error("Error getting sync status:", error);
    return NextResponse.json(
      { error: "Failed to get sync status" },
      { status: 500 }
    );
  }
}
