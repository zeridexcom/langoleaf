import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cache } from "@/lib/redis/client";

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get freelancer profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Try cache first
    const cacheKey = `students:${profile.id}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch from DB
    const { data: students, error } = await supabase
      .from("students")
      .select(`
        *,
        applications:applications(
          id,
          program,
          university,
          status,
          commission_amount,
          created_at
        )
      `)
      .eq("freelancer_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Cache for 5 minutes
    await cache.set(cacheKey, students, 300);

    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Get freelancer profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Create student
    const { data: student, error } = await supabase
      .from("students")
      .insert({
        ...body,
        freelancer_id: profile.id,
        status: "lead",
      })
      .select()
      .single();

    if (error) throw error;

    // Invalidate cache
    await cache.del(`students:${profile.id}`);

    // Award coins for adding student
    await supabase.rpc("award_coins", {
      profile_id: profile.id,
      amount: 10,
      reason: "new_student_added",
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    );
  }
}
