import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { AppError } from "@/lib/utils/error";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    
    const { searchParams } = new URL(request.url);
    const universityId = searchParams.get("universityId");
    const degreeLevel = searchParams.get("degreeLevel");
    const isActive = searchParams.get("isActive") !== "false";

    let query = supabase
      .from("programs")
      .select("*, university:universities(name)")
      .eq("is_active", isActive);

    if (universityId) {
      query = query.eq("university_id", universityId);
    }
    if (degreeLevel) {
      query = query.eq("degree_level", degreeLevel);
    }

    const { data: programs, error } = await query.order("name");

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Failed to fetch programs");
    }

    return NextResponse.json({
      success: true,
      data: programs,
    });
  } catch (error) {
    console.error("Error fetching programs:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch programs" } },
      { status: 500 }
    );
  }
}
