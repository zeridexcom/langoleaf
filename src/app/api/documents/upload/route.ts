import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cloudinary, uploadOptions, getFileCategory } from "@/lib/cloudinary/config";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const studentId = formData.get("studentId") as string;
    const category = formData.get("category") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine upload options based on file type
    const fileCategory = getFileCategory(file.name);
    const options = fileCategory === 'image' ? uploadOptions.images : uploadOptions.documents;

    // Create unique folder path
    const folder = `freelancers/${profile.id}/students/${studentId || 'general'}`;

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          ...options,
          folder: folder,
          public_id: `${Date.now()}_${file.name.replace(/\.[^/.]+$/, '')}`,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      // Write buffer to stream
      const chunks: Buffer[] = [];
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(buffer);
          controller.close();
        }
      });

      // Manually write to upload stream
      uploadStream.write(buffer);
      uploadStream.end();
    });

    const uploadResult = result as any;

    // Save document metadata to database
    const { data: document, error: dbError } = await supabase
      .from("documents")
      .insert({
        freelancer_id: profile.id,
        student_id: studentId || null,
        name: file.name,
        cloudinary_public_id: uploadResult.public_id,
        cloudinary_url: uploadResult.secure_url,
        category: category || 'general',
        file_type: file.type,
        file_size: file.size,
        resource_type: uploadResult.resource_type,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      // Don't fail if DB insert fails, still return upload success
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document?.id,
        name: file.name,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        size: file.size,
        type: file.type,
      },
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}
