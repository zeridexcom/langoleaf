import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cache } from "@/lib/redis/client";

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Try cache
    const cacheKey = `dashboard:${profile.id}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Get real metrics
    const { data: stats } = await supabase.rpc("get_freelancer_stats", {
      freelancer_id: profile.id,
    });

    const { data: recentStudents } = await supabase
      .from("students")
      .select("id, name, email, status, created_at")
      .eq("freelancer_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: recentApplications } = await supabase
      .from("applications")
      .select(`
        id,
        program,
        university,
        status,
        commission_amount,
        created_at,
        student:students(name)
      `)
      .eq("freelancer_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: earnings } = await supabase
      .from("commissions")
      .select("amount, created_at")
      .eq("freelancer_id", profile.id)
      .eq("status", "paid")
      .order("created_at", { ascending: false })
      .limit(30);

    const dashboardData = {
      stats: stats || {
        totalStudents: 0,
        totalApplications: 0,
        totalEarnings: 0,
        pendingApplications: 0,
        conversionRate: 0,
      },
      recentStudents: recentStudents || [],
      recentApplications: recentApplications || [],
      earnings: earnings || [],
    };

    // Cache for 2 minutes
    await cache.set(cacheKey, dashboardData, 120);

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
