import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cache } from "@/lib/redis/client";

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const cacheKey = `dashboard:${profile.id}`;

    // Try cache (non-blocking)
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
    } catch (cacheReadError) {
      console.error("Dashboard cache read error:", cacheReadError);
    }

    // Get real metrics (with fallback)
    const { data: stats, error: statsError } = await supabase.rpc(
      "get_freelancer_stats",
      {
        freelancer_id: profile.id,
      }
    );

    const { data: recentStudents, error: studentsError } = await supabase
      .from("students")
      .select("id, name, email, status, created_at")
      .eq("freelancer_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: recentApplications, error: applicationsError } = await supabase
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

    const { data: earnings, error: earningsError } = await supabase
      .from("commissions")
      .select("amount, created_at")
      .eq("freelancer_id", profile.id)
      .eq("status", "paid")
      .order("created_at", { ascending: false })
      .limit(30);

    if (studentsError) console.error("Dashboard students query error:", studentsError);
    if (applicationsError) console.error("Dashboard applications query error:", applicationsError);
    if (earningsError) console.error("Dashboard earnings query error:", earningsError);
    if (statsError) console.error("Dashboard stats RPC error:", statsError);

    const safeRecentStudents = recentStudents || [];
    const safeRecentApplications = recentApplications || [];
    const safeEarnings = earnings || [];

    const fallbackStats = {
      totalStudents: safeRecentStudents.length,
      totalApplications: safeRecentApplications.length,
      totalEarnings: safeEarnings.reduce(
        (sum: number, item: { amount?: number | null }) => sum + (item.amount || 0),
        0
      ),
      pendingApplications: safeRecentApplications.filter(
        (item: { status?: string }) => item.status === "application_submitted"
      ).length,
      conversionRate:
        safeRecentApplications.length > 0
          ? Math.round(
              (safeRecentApplications.filter(
                (item: { status?: string }) => item.status === "enrolled"
              ).length /
                safeRecentApplications.length) *
                1000
            ) / 10
          : 0,
    };

    const dashboardData = {
      stats: stats || fallbackStats,
      recentStudents: safeRecentStudents,
      recentApplications: safeRecentApplications,
      earnings: safeEarnings,
    };

    // Cache for 2 minutes (non-blocking)
    try {
      await cache.set(cacheKey, dashboardData, 120);
    } catch (cacheWriteError) {
      console.error("Dashboard cache write error:", cacheWriteError);
    }

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
