import { createClient } from "@/lib/supabase/server";
import { AppError, handleSupabaseError } from "@/lib/utils/error";

// Types
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type NotificationType = 
  | "student_assigned"
  | "student_created"
  | "application_status_changed"
  | "document_uploaded"
  | "document_verified"
  | "note_added"
  | "reminder_due"
  | "coins_earned"
  | "welcome"
  | "system"
  | "general";

export interface CreateNotificationInput {
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  student_assigned: boolean;
  application_status_changed: boolean;
  document_uploaded: boolean;
  document_verified: boolean;
  note_added: boolean;
  reminder_due: boolean;
  coins_earned: boolean;
  system_notifications: boolean;
  created_at: string;
  updated_at: string;
}

// Create a new notification
export async function createNotification(
  input: CreateNotificationInput
): Promise<Notification> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: input.user_id,
        title: input.title,
        message: input.message,
        type: input.type,
        link: input.link,
        metadata: input.metadata,
        read: false,
      })
      .select()
      .single();

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Failed to create notification");
    }

    return data;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

// Get notifications for a user
export async function getNotifications(
  userId: string,
  options: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
  try {
    const supabase = createClient();
    const { unreadOnly = false, limit = 20, offset = 0 } = options;

    // Build query
    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (unreadOnly) {
      query = query.eq("read", false);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Failed to fetch notifications");
    }

    // Get unread count
    const { count: unreadCount, error: unreadError } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (unreadError) {
      console.error("Error fetching unread count:", unreadError);
    }

    return {
      notifications: data || [],
      total: count || 0,
      unreadCount: unreadCount || 0,
    };
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

// Mark notification as read
export async function markAsRead(
  notificationId: string,
  userId: string
): Promise<void> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Failed to mark notification as read");
    }
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

// Mark all notifications as read
export async function markAllAsRead(userId: string): Promise<void> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Failed to mark all notifications as read");
    }
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

// Delete a notification
export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<void> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Failed to delete notification");
    }
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

// Get notification preferences
export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences | null> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new AppError("INTERNAL_ERROR", "Failed to fetch notification preferences");
    }

    return data;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

// Update notification preferences
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<Omit<NotificationPreferences, "id" | "user_id" | "created_at" | "updated_at">>
): Promise<NotificationPreferences> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("notification_preferences")
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Failed to update notification preferences");
    }

    return data;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

// Helper functions for creating specific notification types

export async function notifyStudentAssigned(
  freelancerId: string,
  studentName: string,
  studentId: string
): Promise<Notification> {
  return createNotification({
    user_id: freelancerId,
    title: "New Student Assigned",
    message: `${studentName} has been assigned to you.`,
    type: "student_assigned",
    link: `/students/${studentId}`,
    metadata: { student_id: studentId, student_name: studentName },
  });
}

export async function notifyStudentCreated(
  freelancerId: string,
  studentName: string,
  studentId: string
): Promise<Notification> {
  return createNotification({
    user_id: freelancerId,
    title: "Student Created",
    message: `${studentName} has been successfully added to your leads.`,
    type: "student_created",
    link: `/students/${studentId}`,
    metadata: { student_id: studentId, student_name: studentName },
  });
}

export async function notifyApplicationStatusChanged(
  freelancerId: string,
  studentName: string,
  applicationId: string,
  oldStatus: string,
  newStatus: string
): Promise<Notification> {
  return createNotification({
    user_id: freelancerId,
    title: "Application Status Updated",
    message: `${studentName}'s application status changed from ${oldStatus} to ${newStatus}.`,
    type: "application_status_changed",
    link: `/applications/${applicationId}`,
    metadata: {
      application_id: applicationId,
      student_name: studentName,
      old_status: oldStatus,
      new_status: newStatus,
    },
  });
}

export async function notifyDocumentUploaded(
  freelancerId: string,
  studentName: string,
  documentName: string,
  documentId: string
): Promise<Notification> {
  return createNotification({
    user_id: freelancerId,
    title: "Document Uploaded",
    message: `${documentName} has been uploaded for ${studentName}.`,
    type: "document_uploaded",
    link: `/documents/${documentId}`,
    metadata: {
      document_id: documentId,
      document_name: documentName,
      student_name: studentName,
    },
  });
}

export async function notifyDocumentVerified(
  freelancerId: string,
  studentName: string,
  documentName: string,
  documentId: string
): Promise<Notification> {
  return createNotification({
    user_id: freelancerId,
    title: "Document Verified",
    message: `${documentName} for ${studentName} has been verified.`,
    type: "document_verified",
    link: `/documents/${documentId}`,
    metadata: {
      document_id: documentId,
      document_name: documentName,
      student_name: studentName,
    },
  });
}

export async function notifyNoteAdded(
  freelancerId: string,
  studentName: string,
  notePreview: string,
  studentId: string
): Promise<Notification> {
  return createNotification({
    user_id: freelancerId,
    title: "New Note Added",
    message: `A new note was added for ${studentName}: "${notePreview.substring(0, 50)}${notePreview.length > 50 ? "..." : ""}"`,
    type: "note_added",
    link: `/students/${studentId}?tab=notes`,
    metadata: {
      student_id: studentId,
      student_name: studentName,
      note_preview: notePreview.substring(0, 100),
    },
  });
}

export async function notifyReminderDue(
  freelancerId: string,
  reminderTitle: string,
  studentName: string,
  studentId: string
): Promise<Notification> {
  return createNotification({
    user_id: freelancerId,
    title: "Reminder Due",
    message: `Reminder: ${reminderTitle} for ${studentName}`,
    type: "reminder_due",
    link: `/students/${studentId}`,
    metadata: {
      student_id: studentId,
      student_name: studentName,
      reminder_title: reminderTitle,
    },
  });
}

export async function notifyCoinsEarned(
  freelancerId: string,
  amount: number,
  reason: string
): Promise<Notification> {
  return createNotification({
    user_id: freelancerId,
    title: "Coins Earned! 🎉",
    message: `You earned ${amount} coins for ${reason}.`,
    type: "coins_earned",
    link: "/dashboard",
    metadata: {
      amount,
      reason,
    },
  });
}

export async function notifyWelcome(freelancerId: string): Promise<Notification> {
  return createNotification({
    user_id: freelancerId,
    title: "Welcome to Lango!",
    message: "Thanks for joining our partner portal. Start adding students to earn coins and grow your business.",
    type: "welcome",
    link: "/students/add",
  });
}
