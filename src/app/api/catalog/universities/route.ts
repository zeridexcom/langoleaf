import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { AppError } from "@/lib/utils/error";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country");
    const isActive = searchParams.get("isActive") !== "false";

    let query = supabase
      .from("universities")
      .select("*")
      .eq("is_active", isActive);

    if (country) {
      query = query.eq("country", country);
    }

    const { data: universities, error } = await query.order("name");

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Failed to fetch universities");
    }

    return NextResponse.json({
      success: true,
      data: universities,
    });
  } catch (error) {
    console.error("Error fetching universities:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch universities" } },
      { status: 500 }
    );
  }
}
