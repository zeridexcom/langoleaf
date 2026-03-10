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

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    // Get documents from database
    const { data: dbDocuments, error: dbError } = await supabase
      .from("student_documents")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (dbError) {
      console.error("Error fetching documents from database:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 }
      );
    }

    // Also get from Cloudinary to ensure we have latest
    const cloudinaryResult = await getStudentDocuments(studentId);

    // Merge database records with Cloudinary data
    const documents = dbDocuments?.map((dbDoc) => {
      const cloudDoc = cloudinaryResult.documents?.find(
        (d) => d.id === dbDoc.public_id
      );
      return {
        id: dbDoc.id,
        url: dbDoc.url,
        type: dbDoc.type,
        typeLabel: cloudDoc?.typeLabel || dbDoc.type,
        format: dbDoc.format,
        size: dbDoc.size,
        createdAt: dbDoc.created_at,
        thumbnail: cloudDoc?.thumbnail || dbDoc.url,
        publicId: dbDoc.public_id,
      };
    }) || [];

    return NextResponse.json({
      success: true,
      documents,
    });
  } catch (error) {
    console.error("Error in documents API:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
