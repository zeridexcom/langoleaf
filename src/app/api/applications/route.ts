import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ApplicationService } from "@/lib/services/application-service";
import { AppError } from "@/lib/utils/error";
import { awardCoinsForApplicationSubmitted, awardCoinsForEnrollment } from "@/lib/services/gamification-service";

export const dynamic = "force-dynamic";

// Validation schema for query parameters
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(["created_at", "updated_at", "status"]).default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  status: z.array(z.string()).optional(),
  universityId: z.string().optional(),
  programId: z.string().optional(),
  studentId: z.string().optional(),
});

// Validation schema for creating application
const createApplicationSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  universityId: z.string().uuid("Invalid university ID"),
  programId: z.string().uuid("Invalid program ID"),
  intakeDate: z.string().optional(),
});

// GET /api/applications - List applications with pagination, sorting, and filtering
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Get freelancer profile
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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      sortBy: searchParams.get("sortBy"),
      sortOrder: searchParams.get("sortOrder"),
      search: searchParams.get("search") || undefined,
      status: searchParams.getAll("status"),
      universityId: searchParams.get("universityId") || undefined,
      programId: searchParams.get("programId") || undefined,
      studentId: searchParams.get("studentId") || undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: "VALIDATION_ERROR", 
            message: "Invalid query parameters",
            details: queryResult.error.flatten().fieldErrors 
          } 
        },
        { status: 400 }
      );
    }

    const { page, limit, sortBy, sortOrder, search, status, universityId, programId, studentId } = queryResult.data;

    // Check if user is admin
    const isAdmin = profile.role === "admin" || profile.role === "super_admin";

    // Use ApplicationService for fetching applications
    const result = await ApplicationService.listApplications(
      isAdmin ? undefined : profile.id,
      {
        search,
        status,
        universityId,
        programId,
        studentId,
      },
      {
        sortBy,
        sortOrder,
      },
      page,
      limit
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: error.code, 
            message: error.message 
          } 
        },
        { status: error.statusCode || 500 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: "INTERNAL_ERROR", 
          message: "Failed to fetch applications" 
        } 
      },
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
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Get freelancer profile
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createApplicationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: "VALIDATION_ERROR", 
            message: "Invalid request body",
            details: validationResult.error.flatten().fieldErrors 
          } 
        },
        { status: 400 }
      );
    }

    // Use ApplicationService to create application
    const application = await ApplicationService.createApplication(
      profile.id,
      {
        studentId: validationResult.data.studentId,
        universityId: validationResult.data.universityId,
        programId: validationResult.data.programId,
        intakeDate: validationResult.data.intakeDate || new Date().toISOString().split('T')[0],
      }
    );

    // Award coins for submitting an application (async, don't wait)
    awardCoinsForApplicationSubmitted(profile.id, application.id).catch((err) => {
      console.error("Failed to award coins for application:", err);
    });

    return NextResponse.json(
      { success: true, data: application },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating application:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: error.code, 
            message: error.message 
          } 
        },
        { status: error.statusCode || 500 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: "INTERNAL_ERROR", 
          message: "Failed to create application" 
        } 
      },
      { status: 500 }
    );
  }
}
