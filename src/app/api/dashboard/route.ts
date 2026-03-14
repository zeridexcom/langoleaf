import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cache } from "@/lib/redis/client";

export const dynamic = "force-dynamic";

// Freelancer Dashboard Data
async function getFreelancerDashboard(supabase: any, profileId: string, cacheKey: string) {
  // Try cache (non-blocking)
  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }
  } catch (cacheReadError) {
    console.error("Dashboard cache read error:", cacheReadError);
  }

  // Get real metrics (with fallback)
  const { data: stats, error: statsError } = await supabase.rpc(
    "get_freelancer_stats",
    {
      freelancer_id: profileId,
    }
  );

  const { data: recentStudents, error: studentsError } = await supabase
    .from("students")
    .select("id, name, email, status, created_at")
    .eq("freelancer_id", profileId)
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
    .eq("freelancer_id", profileId)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: earnings, error: earningsError } = await supabase
    .from("commissions")
    .select("amount, created_at")
    .eq("freelancer_id", profileId)
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
    role: "freelancer",
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

  return dashboardData;
}

// Admin Dashboard Data
async function getAdminDashboard(supabase: any, cacheKey: string) {
  // Try cache (non-blocking)
  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }
  } catch (cacheReadError) {
    console.error("Admin dashboard cache read error:", cacheReadError);
  }

  // Get system-wide statistics
  const { data: systemStats, error: systemStatsError } = await supabase.rpc(
    "get_system_stats"
  );

  // Get total counts
  const { count: totalStudents, error: studentsCountError } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true });

  const { count: totalFreelancers, error: freelancersCountError } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "freelancer");

  const { count: totalApplications, error: applicationsCountError } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true });

  const { count: enrolledStudents, error: enrolledCountError } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("status", "enrolled");

  // Get recent activity across all freelancers
  const { data: recentStudents, error: studentsError } = await supabase
    .from("students")
    .select(`
      id, 
      name, 
      email, 
      status, 
      created_at,
      freelancer:profiles(full_name, email)
    `)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: recentApplications, error: applicationsError } = await supabase
    .from("applications")
    .select(`
      id,
      program,
      university,
      status,
      commission_amount,
      created_at,
      student:students(name),
      freelancer:profiles(full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(10);

  // Get top performing freelancers
  const { data: topFreelancers, error: topFreelancersError } = await supabase.rpc(
    "get_top_freelancers",
    { limit_count: 5 }
  );

  if (studentsError) console.error("Admin dashboard students query error:", studentsError);
  if (applicationsError) console.error("Admin dashboard applications query error:", applicationsError);
  if (studentsCountError) console.error("Admin dashboard students count error:", studentsCountError);
  if (freelancersCountError) console.error("Admin dashboard freelancers count error:", freelancersCountError);
  if (applicationsCountError) console.error("Admin dashboard applications count error:", applicationsCountError);
  if (enrolledCountError) console.error("Admin dashboard enrolled count error:", enrolledCountError);
  if (topFreelancersError) console.error("Admin dashboard top freelancers error:", topFreelancersError);

  const dashboardData = {
    role: "admin",
    stats: {
      totalStudents: totalStudents || 0,
      totalFreelancers: totalFreelancers || 0,
      totalApplications: totalApplications || 0,
      enrolledStudents: enrolledStudents || 0,
      enrollmentRate: totalStudents && totalStudents > 0
        ? Math.round(((enrolledStudents || 0) / totalStudents) * 1000) / 10
        : 0,
      ...(systemStats || {}),
    },
    recentStudents: recentStudents || [],
    recentApplications: recentApplications || [],
    topFreelancers: topFreelancers || [],
  };

  // Cache for 2 minutes (non-blocking)
  try {
    await cache.set(cacheKey, dashboardData, 120);
  } catch (cacheWriteError) {
    console.error("Admin dashboard cache write error:", cacheWriteError);
  }

  return dashboardData;
}

export async function GET() {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Profile not found" } },
        { status: 404 }
      );
    }

    // Check if user is admin
    const isAdmin = profile.role === "admin" || profile.role === "super_admin";

    let dashboardData;
    if (isAdmin) {
      const cacheKey = `dashboard:admin:${profile.id}`;
      dashboardData = await getAdminDashboard(supabase, cacheKey);
    } else {
      const cacheKey = `dashboard:${profile.id}`;
      dashboardData = await getFreelancerDashboard(supabase, profile.id, cacheKey);
    }

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: "INTERNAL_ERROR", 
          message: "Failed to fetch dashboard data" 
        } 
      },
      { status: 500 }
    );
  }
}
