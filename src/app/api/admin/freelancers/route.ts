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

    // Use the RPC function to get all freelancers with stats
    const { data: freelancers, error: freelancersError } = await supabase.rpc(
      "get_all_freelancers_with_stats",
      {
        p_limit: 100,
        p_offset: 0,
      }
    );

    if (freelancersError) {
      console.error("Error fetching freelancers:", freelancersError);
      return NextResponse.json(
        { error: "Failed to fetch freelancers" },
        { status: 500 }
      );
    }

    return NextResponse.json({ freelancers: freelancers || [] });
  } catch (error) {
    console.error("Admin freelancers API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
