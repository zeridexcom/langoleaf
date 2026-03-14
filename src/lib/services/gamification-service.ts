import { createClient } from "@/lib/supabase/client";
import { AppError } from "@/lib/utils/error";

// Types
export type Level = "bronze" | "silver" | "gold" | "platinum";

export interface LevelInfo {
  level: Level;
  minCoins: number;
  maxCoins: number;
  totalCoinsEarned: number;
  progressPercent: number;
  nextLevel?: Level;
  coinsToNextLevel: number;
}

export interface CoinTransaction {
  id: string;
  userId: string;
  amount: number;
  type: "earned" | "spent" | "bonus" | "refund";
  reason: string;
  referenceType?: string;
  referenceId?: string;
  balanceAfter: number;
  createdAt: string;
}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  coinReward: number;
  requirementType: "count" | "milestone" | "streak" | "special";
  requirementValue: number;
  requirementEntity?: string;
  isActive: boolean;
  displayOrder: number;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  achievement: Achievement;
  progress: number;
  completedAt?: string;
  coinRewardClaimed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  fullName: string;
  avatarUrl?: string;
  totalCoinsEarned: number;
  coinsThisMonth: number;
  totalStudents: number;
  totalEnrollments: number;
  achievementsUnlocked: number;
  rank: number;
}

export interface AwardCoinsInput {
  userId: string;
  amount: number;
  reason: string;
  referenceType?: string;
  referenceId?: string;
}

export interface GamificationStats {
  currentBalance: number;
  totalEarned: number;
  totalSpent: number;
  level: LevelInfo;
  achievementsCount: {
    total: number;
    completed: number;
    inProgress: number;
  };
  recentTransactions: CoinTransaction[];
}

// Level configuration
const LEVELS: Record<Level, { min: number; max: number; name: string; color: string }> = {
  bronze: { min: 0, max: 999, name: "Bronze", color: "#cd7f32" },
  silver: { min: 1000, max: 4999, name: "Silver", color: "#c0c0c0" },
  gold: { min: 5000, max: 9999, name: "Gold", color: "#ffd700" },
  platinum: { min: 10000, max: Infinity, name: "Platinum", color: "#e5e4e2" },
};

// Achievement codes
export const ACHIEVEMENT_CODES = {
  FIRST_STUDENT: "first_student",
  STUDENT_COLLECTOR: "student_collector",
  STUDENT_MASTER: "student_master",
  FIRST_APPLICATION: "first_application",
  APPLICATION_PRO: "application_pro",
  FIRST_ENROLLMENT: "first_enrollment",
  ENROLLMENT_EXPERT: "enrollment_expert",
  DOCUMENT_ORGANIZER: "document_organizer",
  QUICK_RESPONDER: "quick_responder",
  PROFILE_COMPLETE: "profile_complete",
  COIN_COLLECTOR: "coin_collector",
  SILVER_AGENT: "silver_agent",
  GOLD_AGENT: "gold_agent",
  PLATINUM_AGENT: "platinum_agent",
} as const;

// Coin rewards
export const COIN_REWARDS = {
  ADD_STUDENT: 10,
  SUBMIT_APPLICATION: 50,
  APPLICATION_ENROLLED: 100,
  DOCUMENT_UPLOADED: 5,
  DOCUMENT_VERIFIED: 10,
  PROFILE_COMPLETED: 50,
  ACHIEVEMENT_UNLOCKED: 25,
  DAILY_LOGIN: 5,
  REFERRAL: 100,
} as const;

/**
 * Get level information based on total coins earned
 */
export function getLevelInfo(totalCoinsEarned: number): LevelInfo {
  let level: Level = "bronze";
  let nextLevel: Level | undefined;
  let minCoins = 0;
  let maxCoins = 999;
  let progressPercent = 0;
  let coinsToNextLevel = 1000 - totalCoinsEarned;

  if (totalCoinsEarned >= 10000) {
    level = "platinum";
    minCoins = 10000;
    maxCoins = Infinity;
    progressPercent = 100;
    coinsToNextLevel = 0;
  } else if (totalCoinsEarned >= 5000) {
    level = "gold";
    nextLevel = "platinum";
    minCoins = 5000;
    maxCoins = 9999;
    progressPercent = Math.min(100, ((totalCoinsEarned - 5000) / 5000) * 100);
    coinsToNextLevel = 10000 - totalCoinsEarned;
  } else if (totalCoinsEarned >= 1000) {
    level = "silver";
    nextLevel = "gold";
    minCoins = 1000;
    maxCoins = 4999;
    progressPercent = Math.min(100, ((totalCoinsEarned - 1000) / 4000) * 100);
    coinsToNextLevel = 5000 - totalCoinsEarned;
  } else {
    level = "bronze";
    nextLevel = "silver";
    minCoins = 0;
    maxCoins = 999;
    progressPercent = Math.min(100, (totalCoinsEarned / 1000) * 100);
    coinsToNextLevel = 1000 - totalCoinsEarned;
  }

  return {
    level,
    minCoins,
    maxCoins,
    totalCoinsEarned,
    progressPercent: Math.round(progressPercent),
    nextLevel,
    coinsToNextLevel: Math.max(0, coinsToNextLevel),
  };
}

/**
 * Award coins to a user
 */
export async function awardCoins(input: AwardCoinsInput): Promise<number> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("award_coins_with_transaction", {
    p_user_id: input.userId,
    p_amount: input.amount,
    p_reason: input.reason,
    p_reference_type: input.referenceType || null,
    p_reference_id: input.referenceId || null,
  });

  if (error) {
    throw new AppError(
      "INTERNAL_ERROR",
      `Failed to award coins: ${error.message}`
    );
  }

  return data as number;
}

/**
 * Spend coins from user balance
 */
export async function spendCoins(
  userId: string,
  amount: number,
  reason: string
): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("spend_coins", {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason,
  });

  if (error) {
    throw new AppError(
      "INTERNAL_ERROR",
      `Failed to spend coins: ${error.message}`
    );
  }

  return data as boolean;
}

/**
 * Get user's gamification stats
 */
export async function getGamificationStats(
  userId: string
): Promise<GamificationStats> {
  const supabase = createClient();

  // Get current balance and total earned
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("coins_balance, total_coins_earned")
    .eq("id", userId)
    .single();

  if (profileError) {
    throw new AppError(
      "INTERNAL_ERROR",
      `Failed to fetch profile: ${profileError.message}`
    );
  }

  // Get level info
  const level = getLevelInfo(profile?.total_coins_earned || 0);

  // Get recent transactions
  const { data: transactions, error: txError } = await supabase
    .from("coin_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (txError) {
    throw new AppError(
      "INTERNAL_ERROR",
      `Failed to fetch transactions: ${txError.message}`
    );
  }

  // Get achievements count
  const { data: achievements, error: achError } = await supabase
    .from("user_achievements")
    .select("completed_at")
    .eq("user_id", userId);

  if (achError) {
    throw new AppError(
      "INTERNAL_ERROR",
      `Failed to fetch achievements: ${achError.message}`
    );
  }

  const completed = achievements?.filter((a) => a.completed_at).length || 0;
  const inProgress = achievements?.filter((a) => !a.completed_at).length || 0;

  // Calculate totals
  const totalEarned =
    transactions
      ?.filter((t) => t.type === "earned" || t.type === "bonus")
      .reduce((sum, t) => sum + t.amount, 0) || 0;

  const totalSpent =
    transactions
      ?.filter((t) => t.type === "spent")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

  return {
    currentBalance: profile?.coins_balance || 0,
    totalEarned,
    totalSpent,
    level,
    achievementsCount: {
      total: completed + inProgress,
      completed,
      inProgress,
    },
    recentTransactions: (transactions || []).map((t) => ({
      id: t.id,
      userId: t.user_id,
      amount: t.amount,
      type: t.type as "earned" | "spent" | "bonus" | "refund",
      reason: t.reason,
      referenceType: t.reference_type || undefined,
      referenceId: t.reference_id || undefined,
      balanceAfter: t.balance_after,
      createdAt: t.created_at,
    })),
  };
}

/**
 * Get all available achievements
 */
export async function getAchievements(): Promise<Achievement[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    throw new AppError(
      "INTERNAL_ERROR",
      `Failed to fetch achievements: ${error.message}`
    );
  }

  return (data || []).map((a) => ({
    id: a.id,
    code: a.code,
    name: a.name,
    description: a.description,
    icon: a.icon,
    color: a.color,
    coinReward: a.coin_reward,
    requirementType: a.requirement_type,
    requirementValue: a.requirement_value,
    requirementEntity: a.requirement_entity || undefined,
    isActive: a.is_active,
    displayOrder: a.display_order,
  }));
}

/**
 * Get user's achievements with progress
 */
export async function getUserAchievements(
  userId: string
): Promise<UserAchievement[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_achievements")
    .select(`
      *,
      achievement:achievements(*)
    `)
    .eq("user_id", userId)
    .order("completed_at", { ascending: false, nullsFirst: false });

  if (error) {
    throw new AppError(
      "INTERNAL_ERROR",
      `Failed to fetch user achievements: ${error.message}`
    );
  }

  return (data || []).map((ua) => ({
    id: ua.id,
    userId: ua.user_id,
    achievementId: ua.achievement_id,
    achievement: {
      id: ua.achievement.id,
      code: ua.achievement.code,
      name: ua.achievement.name,
      description: ua.achievement.description,
      icon: ua.achievement.icon,
      color: ua.achievement.color,
      coinReward: ua.achievement.coin_reward,
      requirementType: ua.achievement.requirement_type,
      requirementValue: ua.achievement.requirement_value,
      requirementEntity: ua.achievement.requirement_entity || undefined,
      isActive: ua.achievement.is_active,
      displayOrder: ua.achievement.display_order,
    },
    progress: ua.progress,
    completedAt: ua.completed_at || undefined,
    coinRewardClaimed: ua.coin_reward_claimed,
    createdAt: ua.created_at,
    updatedAt: ua.updated_at,
  }));
}

/**
 * Check and award an achievement to a user
 */
export async function checkAndAwardAchievement(
  userId: string,
  achievementCode: string
): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("check_and_award_achievement", {
    p_user_id: userId,
    p_achievement_code: achievementCode,
  });

  if (error) {
    throw new AppError(
      "INTERNAL_ERROR",
      `Failed to check achievement: ${error.message}`
    );
  }

  return data as boolean;
}

/**
 * Update achievement progress
 */
export async function updateAchievementProgress(
  userId: string,
  achievementCode: string,
  progress: number
): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("update_achievement_progress", {
    p_user_id: userId,
    p_achievement_code: achievementCode,
    p_progress: progress,
  });

  if (error) {
    throw new AppError(
      "INTERNAL_ERROR",
      `Failed to update achievement progress: ${error.message}`
    );
  }

  return data as boolean;
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .limit(limit);

  if (error) {
    throw new AppError(
      "INTERNAL_ERROR",
      `Failed to fetch leaderboard: ${error.message}`
    );
  }

  return (data || []).map((entry) => ({
    userId: entry.user_id,
    fullName: entry.full_name,
    avatarUrl: entry.avatar_url || undefined,
    totalCoinsEarned: entry.total_coins_earned,
    coinsThisMonth: entry.coins_this_month,
    totalStudents: entry.total_students,
    totalEnrollments: entry.total_enrollments,
    achievementsUnlocked: entry.achievements_unlocked,
    rank: entry.rank,
  }));
}

/**
 * Get user's rank on leaderboard
 */
export async function getUserRank(userId: string): Promise<number | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("leaderboard")
    .select("rank")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // User not found in leaderboard
    }
    throw new AppError(
      "INTERNAL_ERROR",
      `Failed to fetch user rank: ${error.message}`
    );
  }

  return data?.rank || null;
}

/**
 * Award coins for adding a student
 */
export async function awardCoinsForStudentAdded(
  userId: string,
  studentId: string
): Promise<void> {
  // Award base coins
  await awardCoins({
    userId,
    amount: COIN_REWARDS.ADD_STUDENT,
    reason: "Student added to system",
    referenceType: "student",
    referenceId: studentId,
  });

  // Check achievements
  await checkAndAwardAchievement(userId, ACHIEVEMENT_CODES.FIRST_STUDENT);
  // Progress tracking for other achievements will be handled by triggers or separate calls
}

/**
 * Award coins for application submission
 */
export async function awardCoinsForApplicationSubmitted(
  userId: string,
  applicationId: string
): Promise<void> {
  await awardCoins({
    userId,
    amount: COIN_REWARDS.SUBMIT_APPLICATION,
    reason: "Application submitted",
    referenceType: "application",
    referenceId: applicationId,
  });

  await checkAndAwardAchievement(userId, ACHIEVEMENT_CODES.FIRST_APPLICATION);
}

/**
 * Award coins for enrollment
 */
export async function awardCoinsForEnrollment(
  userId: string,
  applicationId: string
): Promise<void> {
  await awardCoins({
    userId,
    amount: COIN_REWARDS.APPLICATION_ENROLLED,
    reason: "Student enrolled successfully",
    referenceType: "application",
    referenceId: applicationId,
  });

  await checkAndAwardAchievement(userId, ACHIEVEMENT_CODES.FIRST_ENROLLMENT);
}

/**
 * Award coins for document upload
 */
export async function awardCoinsForDocumentUploaded(
  userId: string,
  documentId: string
): Promise<void> {
  await awardCoins({
    userId,
    amount: COIN_REWARDS.DOCUMENT_UPLOADED,
    reason: "Document uploaded",
    referenceType: "document",
    referenceId: documentId,
  });

  await checkAndAwardAchievement(userId, ACHIEVEMENT_CODES.DOCUMENT_ORGANIZER);
}

/**
 * Award coins for document verification
 */
export async function awardCoinsForDocumentVerified(
  userId: string,
  documentId: string
): Promise<void> {
  await awardCoins({
    userId,
    amount: COIN_REWARDS.DOCUMENT_VERIFIED,
    reason: "Document verified",
    referenceType: "document",
    referenceId: documentId,
  });
}

/**
 * Get coin transaction history
 */
export async function getTransactionHistory(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    type?: "earned" | "spent" | "bonus" | "refund";
  } = {}
): Promise<{ transactions: CoinTransaction[]; total: number }> {
  const supabase = createClient();

  let query = supabase
    .from("coin_transactions")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (options.type) {
    query = query.eq("type", options.type);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new AppError(
      "INTERNAL_ERROR",
      `Failed to fetch transaction history: ${error.message}`
    );
  }

  return {
    transactions: (data || []).map((t) => ({
      id: t.id,
      userId: t.user_id,
      amount: t.amount,
      type: t.type as "earned" | "spent" | "bonus" | "refund",
      reason: t.reason,
      referenceType: t.reference_type || undefined,
      referenceId: t.reference_id || undefined,
      balanceAfter: t.balance_after,
      createdAt: t.created_at,
    })),
    total: count || 0,
  };
}
