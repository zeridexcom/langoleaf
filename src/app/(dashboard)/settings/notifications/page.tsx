"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useNotificationPreferences, useUpdateNotificationPreferences } from "@/hooks/useNotifications";
import { toast } from "sonner";
import { 
  Bell, 
  Mail, 
  Smartphone, 
  User, 
  FileText, 
  CheckCircle, 
  MessageSquare, 
  Clock, 
  Coins, 
  Settings,
  Loader2
} from "lucide-react";

export default function NotificationSettingsPage() {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();
  const [localPreferences, setLocalPreferences] = useState(preferences);

  // Update local state when data loads
  if (preferences && !localPreferences) {
    setLocalPreferences(preferences);
  }

  const handleToggle = (key: string) => {
    if (!localPreferences) return;
    
    setLocalPreferences(prev => ({
      ...prev!,
      [key]: !prev![key as keyof typeof prev],
    }));
  };

  const handleSave = async () => {
    if (!localPreferences) return;

    try {
      await updatePreferences.mutateAsync({
        email_notifications: localPreferences.email_notifications,
        push_notifications: localPreferences.push_notifications,
        student_assigned: localPreferences.student_assigned,
        application_status_changed: localPreferences.application_status_changed,
        document_uploaded: localPreferences.document_uploaded,
        document_verified: localPreferences.document_verified,
        note_added: localPreferences.note_added,
        reminder_due: localPreferences.reminder_due,
        coins_earned: localPreferences.coins_earned,
        system_notifications: localPreferences.system_notifications,
      });
      toast.success("Notification preferences saved successfully");
    } catch (error) {
      toast.error("Failed to save preferences");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Settings"
        description="Customize how and when you receive notifications"
      />

      {/* Global Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Global Settings</h3>
            <p className="text-sm text-gray-500">Control how you receive notifications</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
            </div>
            <Switch
              checked={localPreferences?.email_notifications ?? true}
              onCheckedChange={() => handleToggle("email_notifications")}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Push Notifications</p>
                <p className="text-sm text-gray-500">Receive browser push notifications</p>
              </div>
            </div>
            <Switch
              checked={localPreferences?.push_notifications ?? true}
              onCheckedChange={() => handleToggle("push_notifications")}
            />
          </div>
        </div>
      </Card>

      {/* Notification Types */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Notification Types</h3>
            <p className="text-sm text-gray-500">Choose which events trigger notifications</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900">Student Assigned</p>
                <p className="text-sm text-gray-500">When a new student is assigned to you</p>
              </div>
            </div>
            <Switch
              checked={localPreferences?.student_assigned ?? true}
              onCheckedChange={() => handleToggle("student_assigned")}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-purple-500" />
              <div>
                <p className="font-medium text-gray-900">Application Status Changes</p>
                <p className="text-sm text-gray-500">When application status is updated</p>
              </div>
            </div>
            <Switch
              checked={localPreferences?.application_status_changed ?? true}
              onCheckedChange={() => handleToggle("application_status_changed")}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-orange-500" />
              <div>
                <p className="font-medium text-gray-900">Document Uploaded</p>
                <p className="text-sm text-gray-500">When a new document is uploaded</p>
              </div>
            </div>
            <Switch
              checked={localPreferences?.document_uploaded ?? true}
              onCheckedChange={() => handleToggle("document_uploaded")}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <div>
                <p className="font-medium text-gray-900">Document Verified</p>
                <p className="text-sm text-gray-500">When a document is verified</p>
              </div>
            </div>
            <Switch
              checked={localPreferences?.document_verified ?? true}
              onCheckedChange={() => handleToggle("document_verified")}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Notes Added</p>
                <p className="text-sm text-gray-500">When a new note is added to a student</p>
              </div>
            </div>
            <Switch
              checked={localPreferences?.note_added ?? true}
              onCheckedChange={() => handleToggle("note_added")}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-red-500" />
              <div>
                <p className="font-medium text-gray-900">Reminders Due</p>
                <p className="text-sm text-gray-500">When a reminder is due</p>
              </div>
            </div>
            <Switch
              checked={localPreferences?.reminder_due ?? true}
              onCheckedChange={() => handleToggle("reminder_due")}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Coins className="w-4 h-4 text-yellow-500" />
              <div>
                <p className="font-medium text-gray-900">Coins Earned</p>
                <p className="text-sm text-gray-500">When you earn coins for actions</p>
              </div>
            </div>
            <Switch
              checked={localPreferences?.coins_earned ?? true}
              onCheckedChange={() => handleToggle("coins_earned")}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">System Notifications</p>
                <p className="text-sm text-gray-500">Important system updates and announcements</p>
              </div>
            </div>
            <Switch
              checked={localPreferences?.system_notifications ?? true}
              onCheckedChange={() => handleToggle("system_notifications")}
            />
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={updatePreferences.isPending}
          className="min-w-[120px]"
        >
          {updatePreferences.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
}
