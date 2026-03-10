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

// GET /api/documents/[id]/download - Generate signed download URL
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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
      .select("id, role")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const documentId = params.id;

    // Get document metadata
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check access (owner or admin)
    if (document.freelancer_id !== profile.id && profile.role !== 'admin') {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Generate signed URL (expires in 1 hour)
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        public_id: document.cloudinary_public_id,
      },
      process.env.CLOUDINARY_API_SECRET!
    );

    // Build signed URL
    const signedUrl = cloudinary.url(document.cloudinary_public_id, {
      sign_url: true,
      signature,
      timestamp,
      expires_at: timestamp + 3600, // 1 hour expiry
      resource_type: document.cloudinary_resource_type,
      attachment: document.file_name,
    });

    // Log download
    await supabase.from("document_access_logs").insert({
      document_id: documentId,
      user_id: profile.id,
      action: "download",
    });

    // Update download count
    await supabase
      .from("documents")
      .update({
        download_count: document.download_count + 1,
        last_downloaded_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    return NextResponse.json({
      success: true,
      downloadUrl: signedUrl,
      fileName: document.file_name,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("Error generating download URL:", error);
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }
}
