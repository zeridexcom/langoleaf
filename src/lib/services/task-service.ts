import { createClient } from "@/lib/supabase/server";
import { AppError, handleSupabaseError } from "@/lib/utils/error";

// Types
export type TaskType = "push_review" | "document_upload" | "profile_complete" | "custom";
export type TaskStatus = "pending" | "in_progress" | "submitted" | "approved" | "rejected";
export type TaskPriority = "urgent" | "normal" | "low";
export type TaskAssignmentStatus = "assigned" | "accepted" | "in_progress" | "completed" | "cancelled";

export interface TaskAttachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

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
  deadline?: string;
  priority: TaskPriority;
  category?: string;
  attachments: TaskAttachment[];
  admin_question?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskAssignment {
  id: string;
  task_id: string;
  freelancer_id: string;
  assigned_by?: string;
  assigned_at: string;
  status: TaskAssignmentStatus;
  created_at: string;
  task?: Task;
  freelancer?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface TaskChat {
  id: string;
  task_id: string;
  submission_id?: string;
  sender_id?: string;
  message: string;
  attachments: TaskAttachment[];
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    role: string;
  };
}

export interface TaskSubmission {
  id: string;
  task_id: string;
  freelancer_id: string;
  submission_data: {
    review_link?: string;
    review_text?: string;
    template_id?: number;
    answer?: string;
  };
  status: TaskStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  reward_credited: boolean;
  accepted_at?: string;
  deadline_extension_requested: boolean;
  deadline_extension_reason?: string;
  deadline_extension_approved?: boolean;
  proof_files: TaskAttachment[];
  new_deadline?: string;
  created_at: string;
  updated_at: string;
  task?: Task;
  freelancer?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
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
        freelancer_id: submission.freelancer_id,
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
        freelancer_id: submission.freelancer_id,
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
  deadline?: string;
  priority?: TaskPriority;
  category?: string;
  attachments?: TaskAttachment[];
  admin_question?: string;
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
        priority: input.priority || "normal",
        attachments: input.attachments || [],
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
            freelancer_id: f.id,
            type: "task_assigned",
            title: "New Task Available! 📋",
            message: `A new task "${input.title}" is available. Complete it to earn ₹${input.reward_amount}!`,
            is_read: false,
            link: "/tasks",
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

// ============ NEW FUNCTIONS FOR TASK ASSIGNMENT SYSTEM ============

// Assign task to specific freelancers (admin)
export async function assignTaskToFreelancers(input: {
  taskId: string;
  freelancerIds: string[];
  assignedBy: string;
}): Promise<TaskAssignment[]> {
  try {
    const supabase = createClient();

    // Create assignments
    const assignments = input.freelancerIds.map((freelancerId) => ({
      task_id: input.taskId,
      freelancer_id: freelancerId,
      assigned_by: input.assignedBy,
      status: "assigned" as TaskAssignmentStatus,
    }));

    const { data, error } = await supabase
      .from("task_assignments")
      .insert(assignments)
      .select(
        `
        *,
        task:tasks(*),
        freelancer:profiles(id, full_name, email, avatar_url)
      `
      );

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Failed to assign task");
    }

    // Create notifications for assigned freelancers
    try {
      const { data: task } = await supabase
        .from("tasks")
        .select("title, reward_amount")
        .eq("id", input.taskId)
        .single();

      if (task) {
        const notifications = input.freelancerIds.map((freelancerId) => ({
          user_id: freelancerId,
          type: "task_assigned",
          title: "New Task Assigned! 📋",
          message: `You have been assigned a new task "${task.title}". Complete it to earn ₹${task.reward_amount}!`,
          is_read: false,
          link: "/tasks",
        }));

        await supabase.from("notifications").insert(notifications);
      }
    } catch (notifError) {
      console.error("Failed to create notifications:", notifError);
    }

    return data || [];
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

// Get task assignments for a task (admin)
export async function getTaskAssignments(taskId: string): Promise<TaskAssignment[]> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("task_assignments")
      .select(
        `
        *,
        task:tasks(*),
        freelancer:profiles(id, full_name, email, avatar_url)
      `
      )
      .eq("task_id", taskId)
      .order("assigned_at", { ascending: false });

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Failed to fetch task assignments");
    }

    return data || [];
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

// Get assigned tasks for a freelancer
export async function getAssignedTasksForFreelancer(
  freelancerId: string
): Promise<TaskAssignment[]> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("task_assignments")
      .select(
        `
        *,
        task:tasks(*),
        freelancer:profiles(id, full_name, email, avatar_url)
      `
      )
      .eq("freelancer_id", freelancerId)
      .in("status", ["assigned", "accepted", "in_progress"])
      .order("assigned_at", { ascending: false });

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Failed to fetch assigned tasks");
    }

    return data || [];
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

// Accept a task assignment (freelancer)
export async function acceptTaskAssignment(
  taskId: string,
  freelancerId: string
): Promise<TaskAssignment> {
  try {
    const supabase = createClient();

    // Update assignment status
    const { data: assignment, error: assignmentError } = await supabase
      .from("task_assignments")
      .update({
        status: "accepted",
      })
      .eq("task_id", taskId)
      .eq("freelancer_id", freelancerId)
      .select()
      .single();

    if (assignmentError) {
      throw new AppError("INTERNAL_ERROR", "Failed to accept task");
    }

    // Create or update submission with accepted_at
    const { data: existingSubmission } = await supabase
      .from("task_submissions")
      .select("id")
      .eq("task_id", taskId)
      .eq("freelancer_id", freelancerId)
      .maybeSingle();

    if (existingSubmission) {
      await supabase
        .from("task_submissions")
        .update({
          status: "in_progress",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", existingSubmission.id);
    } else {
      await supabase.from("task_submissions").insert({
        task_id: taskId,
        freelancer_id: freelancerId,
        status: "in_progress",
        accepted_at: new Date().toISOString(),
        submission_data: {},
        proof_files: [],
        deadline_extension_requested: false,
      });
    }

    // Notify admin
    try {
      const { data: task } = await supabase
        .from("tasks")
        .select("title")
        .eq("id", taskId)
        .single();

      const { data: freelancer } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", freelancerId)
        .single();

      const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .in("role", ["admin", "super_admin"]);

      if (admins && admins.length > 0) {
        const notifications = admins.map((admin) => ({
          freelancer_id: admin.id,
          type: "task_accepted",
          title: "Task Accepted ✅",
          message: `${freelancer?.full_name || "A freelancer"} has accepted the task "${task?.title || "Unknown"}"`,
          is_read: false,
          link: "/admin/tasks",
        }));

        await supabase.from("notifications").insert(notifications);
      }
    } catch (notifError) {
      console.error("Failed to notify admin:", notifError);
    }

    return assignment;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

// Request deadline extension (freelancer)
export async function requestDeadlineExtension(input: {
  submissionId: string;
  reason: string;
  newDeadline: string;
}): Promise<TaskSubmission> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("task_submissions")
      .update({
        deadline_extension_requested: true,
        deadline_extension_reason: input.reason,
        new_deadline: input.newDeadline,
      })
      .eq("id", input.submissionId)
      .select(
        `
        *,
        task:tasks(*),
        freelancer:profiles(id, full_name, email)
      `
      )
      .single();

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Failed to request extension");
    }

    // Notify admin
    try {
      const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .in("role", ["admin", "super_admin"]);

      if (admins && admins.length > 0 && data) {
        const task = data.task as Task;
        const notifications = admins.map((admin) => ({
          freelancer_id: admin.id,
          type: "deadline_extension_requested",
          title: "Deadline Extension Requested ⏰",
          message: `${data.freelancer?.full_name || "A freelancer"} requested an extension for "${task?.title || "a task"}". New deadline: ${new Date(input.newDeadline).toLocaleDateString()}`,
          is_read: false,
          link: "/admin/tasks",
        }));

        await supabase.from("notifications").insert(notifications);
      }
    } catch (notifError) {
      console.error("Failed to notify admin:", notifError);
    }

    return data;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

// Approve/reject deadline extension (admin)
export async function reviewDeadlineExtension(input: {
  submissionId: string;
  approved: boolean;
  adminId: string;
}): Promise<TaskSubmission> {
  try {
    const supabase = createClient();

    const { data: submission, error: fetchError } = await supabase
      .from("task_submissions")
      .select("*, task:tasks(*)")
      .eq("id", input.submissionId)
      .single();

    if (fetchError || !submission) {
      throw new AppError("NOT_FOUND", "Submission not found");
    }

    const updateData: any = {
      deadline_extension_approved: input.approved,
    };

    if (input.approved && submission.new_deadline) {
      // Update task deadline for this freelancer
      updateData.deadline_extension_requested = false;
    }

    const { data, error } = await supabase
      .from("task_submissions")
      .update(updateData)
      .eq("id", input.submissionId)
      .select()
      .single();

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Failed to review extension");
    }

    // Notify freelancer
    try {
      const task = submission.task as Task;
      await supabase.from("notifications").insert({
        freelancer_id: submission.freelancer_id,
        type: input.approved ? "deadline_extension_approved" : "deadline_extension_rejected",
        title: input.approved ? "Extension Approved ✅" : "Extension Rejected ❌",
        message: input.approved
          ? `Your deadline extension for "${task?.title || "the task"}" has been approved. New deadline: ${submission.new_deadline ? new Date(submission.new_deadline).toLocaleDateString() : "N/A"}`
          : `Your deadline extension request for "${task?.title || "the task"}" was rejected.`,
        is_read: false,
        link: "/tasks",
      });
    } catch (notifError) {
      console.error("Failed to notify freelancer:", notifError);
    }

    return data;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

// Submit proof of completion (freelancer)
export async function submitProof(input: {
  submissionId: string;
  proofFiles: TaskAttachment[];
  submissionData?: {
    review_link?: string;
    review_text?: string;
    answer?: string;
  };
}): Promise<TaskSubmission> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("task_submissions")
      .update({
        status: "submitted",
        proof_files: input.proofFiles,
        submission_data: input.submissionData || {},
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.submissionId)
      .select(
        `
        *,
        task:tasks(*),
        freelancer:profiles(id, full_name, email)
      `
      )
      .single();

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Failed to submit proof");
    }

    // Notify admin
    try {
      const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .in("role", ["admin", "super_admin"]);

      if (admins && admins.length > 0 && data) {
        const task = data.task as Task;
        const notifications = admins.map((admin) => ({
          freelancer_id: admin.id,
          type: "task_submitted",
          title: "Task Submitted for Review 📝",
          message: `${data.freelancer?.full_name || "A freelancer"} submitted proof for "${task?.title || "a task"}"`,
          is_read: false,
          link: "/admin/tasks",
        }));

        await supabase.from("notifications").insert(notifications);
      }
    } catch (notifError) {
      console.error("Failed to notify admin:", notifError);
    }

    return data;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

// Send chat message
export async function sendTaskChat(input: {
  taskId: string;
  submissionId?: string;
  senderId: string;
  message: string;
  attachments?: TaskAttachment[];
}): Promise<TaskChat> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("task_chats")
      .insert({
        task_id: input.taskId,
        submission_id: input.submissionId,
        sender_id: input.senderId,
        message: input.message,
        attachments: input.attachments || [],
        is_read: false,
      })
      .select(
        `
        *,
        sender:profiles(id, full_name, avatar_url, role)
      `
      )
      .single();

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Failed to send message");
    }

    // Notify the other party
    try {
      if (input.submissionId) {
        const { data: submission } = await supabase
          .from("task_submissions")
          .select("freelancer_id, task:tasks(title)")
          .eq("id", input.submissionId)
          .single();

        if (submission) {
          const task = submission.task as any;
          // If sender is freelancer, notify admin; if sender is admin, notify freelancer
          const { data: sender } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", input.senderId)
            .single();

          if (sender?.role === "freelancer") {
            // Notify admins
            const { data: admins } = await supabase
              .from("profiles")
              .select("id")
              .in("role", ["admin", "super_admin"]);

            if (admins && admins.length > 0) {
              const notifications = admins.map((admin) => ({
                freelancer_id: admin.id,
                type: "task_chat_message",
                title: "New Message on Task 💬",
                message: `New message on "${task?.title || "a task"}"`,
                is_read: false,
                link: "/admin/tasks",
              }));

              await supabase.from("notifications").insert(notifications);
            }
          } else {
            // Notify freelancer
            await supabase.from("notifications").insert({
              freelancer_id: submission.freelancer_id,
              type: "task_chat_message",
              title: "New Message on Task 💬",
              message: `Admin replied on "${task?.title || "your task"}"`,
              is_read: false,
              link: "/tasks",
            });
          }
        }
      }
    } catch (notifError) {
      console.error("Failed to notify:", notifError);
    }

    return data;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

// Get chat messages for a task
export async function getTaskChats(input: {
  taskId: string;
  submissionId?: string;
}): Promise<TaskChat[]> {
  try {
    const supabase = createClient();

    let query = supabase
      .from("task_chats")
      .select(
        `
        *,
        sender:profiles(id, full_name, avatar_url, role)
      `
      )
      .eq("task_id", input.taskId)
      .order("created_at", { ascending: true });

    if (input.submissionId) {
      query = query.eq("submission_id", input.submissionId);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Failed to fetch chats");
    }

    return data || [];
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

// Mark chats as read
export async function markChatsAsRead(input: {
  chatIds: string[];
}): Promise<void> {
  try {
    const supabase = createClient();

    await supabase
      .from("task_chats")
      .update({ is_read: true })
      .in("id", input.chatIds);
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

// Get all tasks with assignments overview (admin)
export async function getTasksOverview(): Promise<{
  tasks: (Task & { assignments: TaskAssignment[]; submissions: TaskSubmission[] })[];
  stats: {
    totalTasks: number;
    activeTasks: number;
    totalAssignments: number;
    pendingSubmissions: number;
    completedSubmissions: number;
  };
}> {
  try {
    const supabase = createClient();

    // Get all tasks
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (tasksError) {
      throw new AppError("INTERNAL_ERROR", "Failed to fetch tasks");
    }

    // Get all assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from("task_assignments")
      .select(
        `
        *,
        freelancer:profiles(id, full_name, email, avatar_url)
      `
      );

    if (assignmentsError) {
      throw new AppError("INTERNAL_ERROR", "Failed to fetch assignments");
    }

    // Get all submissions
    const { data: submissions, error: submissionsError } = await supabase
      .from("task_submissions")
      .select(
        `
        *,
        freelancer:profiles(id, full_name, email, avatar_url)
      `
      );

    if (submissionsError) {
      throw new AppError("INTERNAL_ERROR", "Failed to fetch submissions");
    }

    // Combine data
    const tasksWithDetails = (tasks || []).map((task) => {
      const taskAssignments = (assignments || []).filter((a) => a.task_id === task.id);
      const taskSubmissions = (submissions || []).filter((s) => s.task_id === task.id);

      return {
        ...task,
        assignments: taskAssignments,
        submissions: taskSubmissions,
      };
    });

    // Calculate stats
    const stats = {
      totalTasks: tasks?.length || 0,
      activeTasks: tasks?.filter((t) => t.is_active).length || 0,
      totalAssignments: assignments?.length || 0,
      pendingSubmissions: submissions?.filter((s) => s.status === "submitted").length || 0,
      completedSubmissions: submissions?.filter((s) => s.status === "approved").length || 0,
    };

    return { tasks: tasksWithDetails, stats };
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

// Prefilled rejection reasons
export const REJECTION_REASONS = [
  { value: "incomplete", label: "Incomplete submission" },
  { value: "invalid_link", label: "Invalid or broken link" },
  { value: "not_following_guidelines", label: "Not following guidelines" },
  { value: "poor_quality", label: "Poor quality work" },
  { value: "wrong_submission", label: "Wrong submission type" },
  { value: "deadline_missed", label: "Deadline missed" },
  { value: "duplicate", label: "Duplicate submission" },
  { value: "other", label: "Other (specify below)" },
] as const;
