import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadStudentDocument } from "@/lib/cloudinary/server";
import { validateFile, DocumentType } from "@/lib/cloudinary/client";

export const dynamic = "force-dynamic";

// GET handler for testing
export async function GET() {
  return NextResponse.json({ 
    message: "Upload document API is working",
    methods: ["POST"]
  });
}

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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const studentId = formData.get("studentId") as string;
    const documentType = formData.get("documentType") as DocumentType;

    if (!file || !studentId || !documentType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await uploadStudentDocument(
      buffer,
      studentId,
      documentType,
      file.name
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Save document reference to database
    const { data: documentRecord, error: dbError } = await supabase
      .from("student_documents")
      .insert({
        student_id: studentId,
        type: documentType,
        url: result.url,
        public_id: result.publicId,
        format: result.format,
        size: result.size,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error saving document to database:", dbError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      document: {
        id: documentRecord?.id,
        url: result.url,
        publicId: result.publicId,
        type: documentType,
        format: result.format,
        size: result.size,
        createdAt: result.createdAt,
      },
    });
  } catch (error) {
    console.error("Error in upload-document API:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}
