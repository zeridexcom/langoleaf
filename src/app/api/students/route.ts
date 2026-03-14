import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { StudentService } from "@/lib/services/student-service";
import { AppError } from "@/lib/utils/error";
import { awardCoinsForStudentAdded } from "@/lib/services/gamification-service";

export const dynamic = "force-dynamic";

// Validation schema for query parameters
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(["name", "email", "program", "university", "status", "created_at", "updated_at"]).default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  status: z.array(z.string()).optional(),
  program: z.string().optional(),
  university: z.string().optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  freelancerId: z.string().uuid().optional(), // For admin filtering
});

// Validation schema for creating student
const createStudentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  program: z.string().optional(),
  university: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  previous_education: z.string().optional(),
  work_experience: z.string().optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

// GET /api/students - List students with pagination, sorting, and filtering
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

    // Get user profile with role
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
      program: searchParams.get("program") || undefined,
      university: searchParams.get("university") || undefined,
      source: searchParams.get("source") || undefined,
      tags: searchParams.getAll("tags"),
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      freelancerId: searchParams.get("freelancerId") || undefined,
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

    const { page, limit, sortBy, sortOrder, search, status, program, university, source, tags, dateFrom, dateTo, freelancerId } = queryResult.data;

    // Check if user is admin
    const isAdmin = profile.role === "admin" || profile.role === "super_admin";

    // Use StudentService for fetching students
    const result = await StudentService.listStudents(
      isAdmin ? (freelancerId || undefined) : profile.id,
      {
        search,
        status,
        source,
        tags,
        dateFrom,
        dateTo,
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
    console.error("Error fetching students:", error);
    
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
          message: "Failed to fetch students" 
        } 
      },
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
    const validationResult = createStudentSchema.safeParse(body);

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

    // Use StudentService to create student
    const student = await StudentService.createStudentWithApplication(
      profile.id,
      {
        student: {
          full_name: validationResult.data.name,
          email: validationResult.data.email,
          phone: validationResult.data.phone || "",
          date_of_birth: validationResult.data.date_of_birth || null,
          gender: validationResult.data.gender || null,
          nationality: validationResult.data.nationality || null,
          address: validationResult.data.address || null,
          city: validationResult.data.city || null,
          state: validationResult.data.state || null,
          pincode: validationResult.data.pincode || null,
          emergency_contact_name: validationResult.data.emergency_contact_name || null,
          emergency_contact_phone: validationResult.data.emergency_contact_phone || null,
          previous_education: validationResult.data.previous_education || null,
          work_experience: validationResult.data.work_experience || null,
          source: validationResult.data.source || null,
          tags: validationResult.data.tags || [],
          notes: validationResult.data.notes || null,
        },
        application: null,
        documents: [],
      }
    );

    // Award coins for adding a student (async, don't wait)
    awardCoinsForStudentAdded(profile.id, student.id).catch((err) => {
      console.error("Failed to award coins for student:", err);
    });

    return NextResponse.json(
      { success: true, data: student },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating student:", error);
    
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
          message: "Failed to create student" 
        } 
      },
      { status: 500 }
    );
  }
}
