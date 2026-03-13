import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/students - List students with pagination, sorting, and filtering
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
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;
    
    // Sorting
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    
    // Search
    const search = searchParams.get("search") || "";
    
    // Filters
    const status = searchParams.getAll("status");
    const program = searchParams.get("program") || "";
    const university = searchParams.get("university") || "";
    const source = searchParams.get("source") || "";
    const tags = searchParams.getAll("tags");
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    // Build base query
    let query = supabase
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
      `, { count: "exact" })
      .eq("freelancer_id", profile.id);

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Apply status filter
    if (status.length > 0 && !status.includes("all")) {
      query = query.in("status", status);
    }

    // Apply program filter
    if (program) {
      query = query.eq("program", program);
    }

    // Apply university filter
    if (university) {
      query = query.eq("university", university);
    }

    // Apply source filter
    if (source) {
      query = query.eq("source", source);
    }

    // Apply tags filter
    if (tags.length > 0) {
      query = query.contains("tags", tags);
    }

    // Apply date range filter
    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }
    if (dateTo) {
      query = query.lte("created_at", dateTo);
    }

    // Apply sorting
    const validSortColumns = ["name", "email", "program", "university", "status", "created_at", "updated_at"];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : "created_at";
    query = query.order(sortColumn, { ascending: sortOrder === "asc" });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: students, error, count } = await query;

    if (error) throw error;

    // Get unique values for filters (for dropdowns)
    const { data: filterOptions } = await supabase
      .from("students")
      .select("program, university, source, tags")
      .eq("freelancer_id", profile.id);

    const programs = Array.from(new Set(filterOptions?.map(s => s.program).filter(Boolean)));
    const universities = Array.from(new Set(filterOptions?.map(s => s.university).filter(Boolean)));
    const sources = Array.from(new Set(filterOptions?.map(s => s.source).filter(Boolean)));
    const allTags = Array.from(new Set(filterOptions?.flatMap(s => s.tags || []).filter(Boolean)));

    return NextResponse.json({
      students: students || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: (page * limit) < (count || 0),
      },
      filters: {
        programs,
        universities,
        sources,
        tags: allTags,
      },
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

// POST /api/students - Create new student
export async function POST(request: Request) {
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
