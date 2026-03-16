import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
import {
  awardCoins,
  awardCoinsForStudentAdded,
  awardCoinsForApplicationSubmitted,
  awardCoinsForEnrollment,
  awardCoinsForDocumentUploaded,
  awardCoinsForDocumentVerified,
  COIN_REWARDS,
} from "@/lib/services/gamification-service";

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
    const { action, userId, referenceId, amount, reason } = body;

    // Verify the user is awarding to themselves (or is admin)
    if (userId && userId !== user.id) {
      // Check if user is admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const targetUserId = userId || user.id;
    let result;

    switch (action) {
      case "student_added":
        await awardCoinsForStudentAdded(targetUserId, referenceId);
        result = { coins: COIN_REWARDS.ADD_STUDENT, message: "Coins awarded for adding student" };
        break;

      case "application_submitted":
        await awardCoinsForApplicationSubmitted(targetUserId, referenceId);
        result = { coins: COIN_REWARDS.SUBMIT_APPLICATION, message: "Coins awarded for application submission" };
        break;

      case "enrollment":
        await awardCoinsForEnrollment(targetUserId, referenceId);
        result = { coins: COIN_REWARDS.APPLICATION_ENROLLED, message: "Coins awarded for enrollment" };
        break;

      case "document_uploaded":
        await awardCoinsForDocumentUploaded(targetUserId, referenceId);
        result = { coins: COIN_REWARDS.DOCUMENT_UPLOADED, message: "Coins awarded for document upload" };
        break;

      case "document_verified":
        await awardCoinsForDocumentVerified(targetUserId, referenceId);
        result = { coins: COIN_REWARDS.DOCUMENT_VERIFIED, message: "Coins awarded for document verification" };
        break;

      case "custom":
        if (!amount || !reason) {
          return NextResponse.json(
            { error: "Amount and reason required for custom award" },
            { status: 400 }
          );
        }
        const newBalance = await awardCoins({
          userId: targetUserId,
          amount,
          reason,
        });
        result = { coins: amount, balance: newBalance, message: "Custom coins awarded" };
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error awarding coins:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to award coins" },
      { status: 500 }
    );
  }
}
