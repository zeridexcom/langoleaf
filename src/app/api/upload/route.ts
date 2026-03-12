import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const dynamic = "force-dynamic";

// POST /api/upload - Upload document to Cloudinary
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get freelancer profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const applicationId = formData.get("applicationId") as string;
    const studentId = formData.get("studentId") as string;
    const category = formData.get("category") as string || "general";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX" },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64File = `data:${file.type};base64,${buffer.toString("base64")}`;

    // Determine resource type
    const resourceType = file.type.startsWith("image/") ? "image" : "raw";

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(base64File, {
      folder: `freelancer-portal/${profile.id}`,
      resource_type: resourceType,
      public_id: `${Date.now()}_${file.name.replace(/\.[^/.]+$/, "")}`,
      tags: ["document", category, applicationId || "general"],
    });

    // Save document metadata to Supabase
    const { data: document, error } = await supabase
      .from("documents")
      .insert({
        application_id: applicationId || null,
        student_id: studentId || null,
        freelancer_id: profile.id,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        cloudinary_url: uploadResult.secure_url,
        cloudinary_public_id: uploadResult.public_id,
        cloudinary_resource_type: resourceType,
        category,
      })
      .select()
      .single();

    if (error) throw error;

    // Log document upload
    await supabase.from("document_access_logs").insert({
      document_id: document.id,
      user_id: profile.id,
      action: "upload",
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        fileName: file.name,
        fileType: file.type,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        category,
      },
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}
