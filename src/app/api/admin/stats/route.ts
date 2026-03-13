import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Use the RPC function to get system analytics
    const { data: stats, error: statsError } = await supabase.rpc(
      "get_system_analytics"
    );

    if (statsError) {
      console.error("Error fetching system stats:", statsError);
      return NextResponse.json(
        { error: "Failed to fetch system stats" },
        { status: 500 }
      );
    }

    // Return the first row since RPC returns a set
    const systemStats = stats && stats.length > 0 ? stats[0] : {
      total_freelancers: 0,
      total_students: 0,
      total_applications: 0,
      total_enrollments: 0,
      total_revenue: 0,
      students_this_month: 0,
      applications_this_month: 0,
    };

    return NextResponse.json({
      totalFreelancers: systemStats.total_freelancers,
      totalStudents: systemStats.total_students,
      totalApplications: systemStats.total_applications,
      totalEnrollments: systemStats.total_enrollments,
      totalRevenue: systemStats.total_revenue,
      studentsThisMonth: systemStats.students_this_month,
      applicationsThisMonth: systemStats.applications_this_month,
    });
  } catch (error) {
    console.error("Admin stats API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
