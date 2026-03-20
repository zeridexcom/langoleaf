import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");
    const type = searchParams.get("type");

    // Build query
    let query = supabase
      .from("activity_log")
      .select(`
        id,
        action,
        entity_type,
        entity_id,
        details,
        old_values,
        new_values,
        created_at,
        profiles:freelancer_id (
          full_name,
          avatar_url
        )
      `)
      .eq("student_id", params.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq("action", type);
    }

    const { data: activities, error, count } = await query;

    if (error) {
      throw error;
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from("activity_log")
      .select("*", { count: "exact", head: true })
      .eq("student_id", params.id);

    // Transform activities
    const transformedActivities = activities?.map((activity: any) => {
      let title = "";
      let description = "";
      
      switch (activity.action) {
        case "status_changed":
          title = "Status Changed";
          description = `Status changed from "${activity.old_values?.status || 'N/A'}" to "${activity.new_values?.status}"`;
          break;
        case "document_uploaded":
          title = "Document Uploaded";
          description = activity.details?.document_name || "New document uploaded";
          break;
        case "note_added":
          title = "Note Added";
          description = activity.details?.note_preview || "New note added";
          break;
        case "profile_updated":
          title = "Profile Updated";
          description = "Student profile information updated";
          break;
        case "application_created":
          title = "Application Created";
          description = "New application submitted";
          break;
        default:
          title = activity.action.replace(/_/g, " ");
          description = "Activity recorded";
      }

      return {
        id: activity.id,
        type: activity.action,
        title,
        description,
        createdAt: activity.created_at,
        metadata: {
          oldValues: activity.old_values,
          newValues: activity.new_values,
          details: activity.details,
        },
        user: activity.profiles ? {
          name: activity.profiles.full_name,
          avatar: activity.profiles.avatar_url,
        } : undefined,
      };
    }) || [];

    return NextResponse.json({
      activities: transformedActivities,
      hasMore: (offset + limit) < (totalCount || 0),
      total: totalCount,
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}
