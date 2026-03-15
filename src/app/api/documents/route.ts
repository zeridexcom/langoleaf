import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStudentDocuments, deleteDocument } from "@/lib/cloudinary/server";

export const dynamic = "force-dynamic";

// GET /api/documents?studentId=xxx - Get all documents for a student
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

    let query = supabase
      .from("student_documents")
      .select(`
        *,
        student:students(id, full_name, email, freelancer_id)
      `)
      .order("created_at", { ascending: false });

    if (studentId) {
      query = query.eq("student_id", studentId);
    }

    const { data: dbDocuments, error: dbError } = await query;

    if (dbError) {
      console.error("Error fetching documents from database:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 }
      );
    }

    // Filter by freelancer_id manually if student_id was't provided to ensure security 
    // (Supabase RLS should also handle this if configured correctly, but extra safety is good)
    const filteredDocs = dbDocuments?.filter(doc => (doc.student as any)?.freelancer_id === user.id) || [];

    // Map to expected frontend format
    const documents = filteredDocs.map((dbDoc) => {
      return {
        id: dbDoc.id,
        url: dbDoc.url,
        type: dbDoc.type,
        doc_type: dbDoc.type, // Alias for compatibility
        format: dbDoc.format,
        size: dbDoc.size,
        created_at: dbDoc.created_at,
        public_id: dbDoc.public_id,
        file_name: dbDoc.public_id.split("/").pop() || "document",
        student: dbDoc.student,
      };
    });

    return NextResponse.json({
      success: true,
      data: { documents }
    });
  } catch (error) {
    console.error("Error in documents API:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
