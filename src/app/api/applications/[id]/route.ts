import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cache } from "@/lib/redis/client";

export const dynamic = "force-dynamic";

// GET /api/applications/[id] - Get single application
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
      .select("id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Fetch application
    const { data: application, error } = await supabase
      .from("applications")
      .select(`
        *,
        student:students(
          id,
          name,
          email,
          phone
        ),
        documents:documents(*)
      `)
      .eq("id", params.id)
      .eq("freelancer_id", profile.id)
      .single();

    if (error || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 }
    );
  }
}

// PATCH /api/applications/[id] - Update application
export async function PATCH(
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

    const body = await request.json();

    // Get freelancer profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Update application
    const { data: application, error } = await supabase
      .from("applications")
      .update(body)
      .eq("id", params.id)
      .eq("freelancer_id", profile.id)
      .select()
      .single();

    if (error || !application) {
      return NextResponse.json(
        { error: "Application not found or update failed" },
        { status: 404 }
      );
    }

    // Invalidate caches
    await cache.del(`applications:${profile.id}`);
    await cache.del(`dashboard:${profile.id}`);

    return NextResponse.json(application);
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}

// DELETE /api/applications/[id] - Delete application
export async function DELETE(
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
      .select("id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Delete application
    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("id", params.id)
      .eq("freelancer_id", profile.id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete application" },
        { status: 500 }
      );
    }

    // Invalidate caches
    await cache.del(`applications:${profile.id}`);
    await cache.del(`dashboard:${profile.id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting application:", error);
    return NextResponse.json(
      { error: "Failed to delete application" },
      { status: 500 }
    );
  }
}
