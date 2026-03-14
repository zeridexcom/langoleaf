import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { CloudinaryService } from "@/lib/services/cloudinary-service";
import { AppError } from "@/lib/utils/error";

export const dynamic = "force-dynamic";

// POST /api/upload/signature - Get Cloudinary upload signature for authenticated uploads
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Profile not found" } },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { folder, tags, context } = body;

    // Generate upload signature
    const signature = CloudinaryService.generateUploadSignature({
      folder: folder || `student-portal/${profile.id}`,
      tags: tags || ["student-portal"],
      context: {
        ...context,
        user_id: profile.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: signature,
    });
  } catch (error) {
    console.error("Error generating upload signature:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: error.code, 
            message: error.message 
          } 
        },
        { status: error.statusCode || 500 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: "INTERNAL_ERROR", 
          message: "Failed to generate upload signature" 
        } 
      },
      { status: 500 }
    );
  }
}
