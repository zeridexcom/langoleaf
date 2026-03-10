import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cache } from "@/lib/redis/client";

export const dynamic = "force-dynamic";

// GET /api/applications - List applications
export async function GET(request: Request) {
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
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Try cache first
    const cacheKey = `applications:${profile.id}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch from DB
    const { data: applications, error } = await supabase
      .from("applications")
      .select(`
        *,
        student:students(
          id,
          name,
          email,
          phone
        )
      `)
      .eq("freelancer_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Cache for 5 minutes
    await cache.set(cacheKey, applications, 300);

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

// POST /api/applications - Create new application
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { student_id, program, university, documents } = body;

    // Validate required fields
    if (!student_id || !program || !university) {
      return NextResponse.json(
        { error: "Missing required fields: student_id, program, university" },
        { status: 400 }
      );
    }

    // Get freelancer profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Verify student belongs to this freelancer
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id, status")
      .eq("id", student_id)
      .eq("freelancer_id", profile.id)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: "Student not found or access denied" },
        { status: 404 }
      );
    }

    // Create application
    const { data: application, error } = await supabase
      .from("applications")
      .insert({
        freelancer_id: profile.id,
        student_id: student_id,
        program: program,
        university: university,
        status: "application_submitted",
        commission_amount: 0, // Will be set by admin
      })
      .select()
      .single();

    if (error) throw error;

    // Update student status
    await supabase
      .from("students")
      .update({ status: "application_submitted" })
      .eq("id", student_id);

    // Link documents to application if provided
    if (documents && documents.length > 0) {
      await supabase
        .from("documents")
        .update({ application_id: application.id })
        .in("id", documents);
    }

    // Invalidate caches
    await cache.del(`applications:${profile.id}`);
    await cache.del(`students:${profile.id}`);
    await cache.del(`dashboard:${profile.id}`);

    // Award coins for submitting application
    await supabase.rpc("award_coins", {
      profile_id: profile.id,
      amount: 50,
      reason: "application_submitted",
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error("Error creating application:", error);
    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 }
    );
  }
}
