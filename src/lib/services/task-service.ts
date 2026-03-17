import { createClient } from "@/lib/supabase/server";
import { AppError, handleSupabaseError } from "@/lib/utils/error";

// Types
export type TaskType = "push_review" | "document_upload" | "profile_complete";
export type TaskStatus = "pending" | "in_progress" | "submitted" | "approved" | "rejected";

export interface Task {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  reward_amount: number;
  reward_currency: string;
  is_active: boolean;
  auto_assign: boolean;
  target_url?: string;
  created_at: string;
}

export interface TaskSubmission {
  id: string;
  task_id: string;
  freelancer_id: string;
  submission_data: {
    review_link?: string;
    review_text?: string;
    template_id?: number;
  };
  status: TaskStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  reward_credited: boolean;
  created_at: string;
  updated_at: string;
  task?: Task;
}

export interface CreateTaskSubmissionInput {
  task_id: string;
  freelancer_id: string;
  submission_data: {
    review_link: string;
    review_text?: string;
    template_id?: number;
  };
}

// Get all active tasks
export async function getActiveTasks(): Promise<Task[]> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Failed to fetch tasks");
    }

    return data || [];
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

// Get task by ID
export async function getTaskById(taskId: string): Promise<Task | null> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new AppError("INTERNAL_ERROR", "Failed to fetch task");
    }

    return data;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

// Get push review task
export async function getPushReviewTask(): Promise<Task | null> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("type", "push_review")
      .eq("is_active", true)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new AppError("INTERNAL_ERROR", "Failed to fetch push review task");
    }

    return data;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

// Get freelancer's task submissions
export async function getFreelancerTaskSubmissions(
  freelancerId: string,
  taskId?: string
): Promise<TaskSubmission[]> {
  try {
    const supabase = createClient();

    let query = supabase
      .from("task_submissions")
      .select(
        `
        *,
        task:tasks(*)
      `
      )
      .eq("freelancer_id", freelancerId)
      .order("created_at", { ascending: false });

    if (taskId) {
      query = query.eq("task_id", taskId);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Failed to fetch task submissions");
    }

    return data || [];
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

// Get pending tasks for freelancer (tasks they haven't submitted yet)
export async function getPendingTasksForFreelancer(
  freelancerId: string
): Promise<{ task: Task; hasSubmitted: boolean; submission?: TaskSubmission }[]> {
  try {
    const supabase = createClient();

    // Get all active tasks
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .eq("is_active", true)
      .eq("auto_assign", true);

    if (tasksError) {
      throw new AppError("INTERNAL_ERROR", "Failed to fetch tasks");
    }

    // Get freelancer's submissions
    const { data: submissions, error: submissionsError } = await supabase
      .from("task_submissions")
      .select("*")
      .eq("freelancer_id", freelancerId);

    if (submissionsError) {
      throw new AppError("INTERNAL_ERROR", "Failed to fetch submissions");
    }

    // Map tasks with submission status
    return (tasks || []).map((task) => {
      const submission = (submissions || []).find((s) => s.task_id === task.id);
      return {
        task,
        hasSubmitted: !!submission,
        submission,
      };
    });
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

// Get pending tasks count for freelancer
export async function getPendingTasksCount(freelancerId: string): Promise<number> {
  try {
    const pendingTasks = await getPendingTasksForFreelancer(freelancerId);
    return pendingTasks.filter((t) => !t.hasSubmitted || t.submission?.status === "rejected").length;
  } catch (error) {
    return 0;
  }
}

// Submit a task
export async function submitTask(
  input: CreateTaskSubmissionInput
): Promise<TaskSubmission> {
  try {
    const supabase = createClient();

    // Check if already submitted
    const { data: existing, error: checkError } = await supabase
      .from("task_submissions")
      .select("*")
      .eq("task_id", input.task_id)
      .eq("freelancer_id", input.freelancer_id)
      .in("status", ["pending", "in_progress", "submitted"])
      .maybeSingle();

    if (checkError) {
      throw new AppError("INTERNAL_ERROR", "Failed to check existing submission");
    }

    if (existing) {
      throw new AppError("VALIDATION_ERROR", "You have already submitted this task");
    }

    // Create submission
    const { data, error } = await supabase
      .from("task_submissions")
      .insert({
        task_id: input.task_id,
        freelancer_id: input.freelancer_id,
        submission_data: input.submission_data,
        status: "submitted",
      })
      .select()
      .single();

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Failed to submit task");
    }

    return data;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

// Get all pending submissions (for admin)
export async function getPendingSubmissions(): Promise<TaskSubmission[]> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("task_submissions")
      .select(
        `
        *,
        task:tasks(*),
        freelancer:profiles!task_submissions_freelancer_id_fkey(id, full_name, email)
      `
      )
      .eq("status", "submitted")
      .order("created_at", { ascending: false });

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Failed to fetch pending submissions");
    }

    return data || [];
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

// Approve a submission (admin)
export async function approveSubmission(
  submissionId: string,
  adminId: string
): Promise<TaskSubmission> {
  try {
    const supabase = createClient();

    // Get submission details
    const { data: submission, error: fetchError } = await supabase
      .from("task_submissions")
      .select(
        `
        *,
        task:tasks(*)
      `
      )
      .eq("id", submissionId)
      .single();

    if (fetchError || !submission) {
      throw new AppError("NOT_FOUND", "Submission not found");
    }

    // Update submission status
    const { data, error } = await supabase
      .from("task_submissions")
      .update({
        status: "approved",
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        reward_credited: true,
      })
      .eq("id", submissionId)
      .select()
      .single();

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Failed to approve submission");
    }

    // Credit reward to freelancer (using gamification service)
    const task = submission.task as Task;
    if (task && task.reward_amount > 0) {
      try {
        await supabase.rpc("award_coins", {
          profile_id: submission.freelancer_id,
          amount: task.reward_amount,
          reason: `Task completed: ${task.title}`,
        });
      } catch (coinError) {
        console.error("Failed to credit coins:", coinError);
      }
    }

    // Create notification for freelancer
    try {
      await supabase.from("notifications").insert({
        user_id: submission.freelancer_id,
        type: "task_approved",
        title: "Task Approved! 🎉",
        message: `Your ${task?.title || "task"} submission has been approved. ₹${task?.reward_amount || 0} credited to your account!`,
        is_read: false,
      });
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    return data;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

// Reject a submission (admin)
export async function rejectSubmission(
  submissionId: string,
  adminId: string,
  reason: string
): Promise<TaskSubmission> {
  try {
    const supabase = createClient();

    // Get submission details
    const { data: submission, error: fetchError } = await supabase
      .from("task_submissions")
      .select(
        `
        *,
        task:tasks(*)
      `
      )
      .eq("id", submissionId)
      .single();

    if (fetchError || !submission) {
      throw new AppError("NOT_FOUND", "Submission not found");
    }

    // Update submission status
    const { data, error } = await supabase
      .from("task_submissions")
      .update({
        status: "rejected",
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        review_notes: reason,
      })
      .eq("id", submissionId)
      .select()
      .single();

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Failed to reject submission");
    }

    // Create notification for freelancer
    const task = submission.task as Task;
    try {
      await supabase.from("notifications").insert({
        user_id: submission.freelancer_id,
        type: "task_rejected",
        title: "Task Submission Rejected",
        message: `Your ${task?.title || "task"} submission was rejected. Reason: ${reason}. You can resubmit.`,
        is_read: false,
      });
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    return data;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

// Create a new task (admin)
export async function createTask(input: {
  type: TaskType;
  title: string;
  description: string;
  reward_amount: number;
  target_url?: string;
  auto_assign?: boolean;
}): Promise<Task> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        ...input,
        reward_currency: "INR",
        is_active: true,
        auto_assign: input.auto_assign ?? true,
      })
      .select()
      .single();

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Failed to create task");
    }

    // If auto_assign, notify all freelancers
    if (input.auto_assign) {
      try {
        // Get all freelancers
        const { data: freelancers, error: freelancersError } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "freelancer");

        if (!freelancersError && freelancers) {
          // Create notifications for all freelancers
          const notifications = freelancers.map((f) => ({
            user_id: f.id,
            type: "task_assigned",
            title: "New Task Available! 📋",
            message: `A new task "${input.title}" is available. Complete it to earn ₹${input.reward_amount}!`,
            is_read: false,
            link: "/tasks/push-review",
          }));

          await supabase.from("notifications").insert(notifications);
        }
      } catch (notifError) {
        console.error("Failed to notify freelancers:", notifError);
      }
    }

    return data;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}
