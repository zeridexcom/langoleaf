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
  let step = "starting";
  
  try {
    // Check authentication
    step = "checking authentication";
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      return NextResponse.json({ 
        error: "Auth check failed", 
        details: authError.message,
        step 
      }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ 
        error: "Not logged in", 
        details: "Please log in and try again",
        step 
      }, { status: 401 });
    }

    // Parse form data
    step = "parsing form data";
    let formData;
    try {
      formData = await request.formData();
    } catch (e) {
      return NextResponse.json({ 
        error: "Failed to read form data", 
        details: "The file might be too large or corrupted",
        step 
      }, { status: 400 });
    }
    
    const file = formData.get("file") as File;
    const studentId = formData.get("studentId") as string;
    const documentType = formData.get("documentType") as DocumentType;

    if (!file) {
      return NextResponse.json({ 
        error: "No file selected", 
        details: "Please select a file to upload",
        step 
      }, { status: 400 });
    }
    
    if (!studentId) {
      return NextResponse.json({ 
        error: "No student selected", 
        details: "Student ID is missing. Please refresh and try again.",
        step 
      }, { status: 400 });
    }
    
    if (!documentType) {
      return NextResponse.json({ 
        error: "No document type selected", 
        details: "Please select a document type",
        step 
      }, { status: 400 });
    }

    // Validate file
    step = "validating file";
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json({ 
        error: "Invalid file", 
        details: validation.error,
        step 
      }, { status: 400 });
    }

    // Convert file to buffer
    step = "reading file";
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    step = "uploading to Cloudinary";
    const result = await uploadStudentDocument(
      buffer,
      studentId,
      documentType,
      file.name
    );

    if (!result.success) {
      return NextResponse.json({ 
        error: "Cloudinary upload failed", 
        details: result.error || "Unknown error from Cloudinary. Check if CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set in Vercel environment variables.",
        step 
      }, { status: 500 });
    }

    // Save document reference to database
    step = "saving to database";
    const { data: documentRecord, error: dbError } = await supabase
      .from("student_documents")
      .insert({
        student_id: studentId,
        type: documentType,
        url: result.url!,
        public_id: result.publicId!,
        format: result.format,
        size: result.size,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ 
        error: "Database save failed", 
        details: `${dbError.message} (Code: ${dbError.code}). The file was uploaded to Cloudinary but not saved to database.`,
        step,
        cloudinaryUrl: result.url 
      }, { status: 500 });
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
    return NextResponse.json({ 
      error: "Unexpected error", 
      details: error instanceof Error ? error.message : "Unknown error occurred",
      step 
    }, { status: 500 });
  }
}
