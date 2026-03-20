import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
import {
  getAchievements,
  getUserAchievements,
  checkAndAwardAchievement,
  updateAchievementProgress,
} from "@/lib/services/gamification-service";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || user.id;
    const includeAll = searchParams.get("all") === "true";

    // Check if requesting another user's achievements
    if (userId !== user.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const [userAchievements, allAchievements] = await Promise.all([
      getUserAchievements(userId),
      includeAll ? getAchievements() : null,
    ]);

    return NextResponse.json({
      userAchievements,
      allAchievements,
      userId,
    });
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch achievements" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, userId, achievementCode, progress } = body;

    const targetUserId = userId || user.id;

    // Verify permissions
    if (targetUserId !== user.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    let result;

    switch (action) {
      case "check_and_award":
        if (!achievementCode) {
          return NextResponse.json(
            { error: "Achievement code required" },
            { status: 400 }
          );
        }
        result = await checkAndAwardAchievement(targetUserId, achievementCode);
        return NextResponse.json({
          success: true,
          awarded: result,
          message: result ? "Achievement unlocked!" : "Achievement not yet completed",
        });

      case "update_progress":
        if (!achievementCode || progress === undefined) {
          return NextResponse.json(
            { error: "Achievement code and progress required" },
            { status: 400 }
          );
        }
        result = await updateAchievementProgress(targetUserId, achievementCode, progress);
        return NextResponse.json({
          success: true,
          updated: result,
          message: "Progress updated",
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error updating achievements:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update achievements" },
      { status: 500 }
    );
  }
}
