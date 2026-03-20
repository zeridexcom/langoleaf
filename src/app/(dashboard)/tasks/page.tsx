"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  Star,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  ChevronRight,
  MessageCircle,
  Upload,
  Calendar,
  Flag,
  AlertCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TaskAcceptModal } from "@/components/freelancer/task-accept-modal";
import { SubmitProofModal } from "@/components/freelancer/submit-proof-modal";
import { DeadlineExtensionModal } from "@/components/freelancer/deadline-extension-modal";
import { FreelancerTaskChat } from "@/components/freelancer/freelancer-task-chat";
import { cn } from "@/lib/utils";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Modals state
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch active tasks that are auto-assign OR explicitly assigned to user
      const { data: assignments } = await supabase
        .from("task_assignments")
        .select(`*, task:tasks(*)`)
        .eq("freelancer_id", user.id);

      const { data: activeTasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("is_active", true);

      // Fetch user's submissions
      const { data: submissions } = await supabase
        .from("task_submissions")
        .select("*")
        .eq("freelancer_id", user.id);

      // Merge them
      const taskMap = new Map();

      // Add auto-assign tasks first
      (activeTasks || []).forEach(task => {
        if (task.auto_assign) {
          taskMap.set(task.id, {
            task,
            assignment: null,
            submission: submissions?.find(s => s.task_id === task.id) || null
          });
        }
      });

      // Add/override with explicitly assigned tasks
      (assignments || []).forEach(assign => {
        if (assign.task) {
          taskMap.set(assign.task.id, {
            task: assign.task,
            assignment: assign,
            submission: submissions?.find(s => s.task_id === assign.task.id) || null
          });
        }
      });

      setTasks(Array.from(taskMap.values()).sort((a, b) => {
        return new Date(b.task.created_at).getTime() - new Date(a.task.created_at).getTime();
      }));
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const priorityColors = {
    urgent: "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20",
    normal: "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
    low: "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20",
  };

  const getStatusBadge = (item: any) => {
    const status = item.submission?.status || item.assignment?.status || "pending";

    const styles: Record<string, { bg: string; text: string; icon: any; label: string }> = {
      pending: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", icon: Clock, label: "Available" },
      assigned: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", icon: AlertCircle, label: "Assigned to You" },
      accepted: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-400", icon: CheckCircle, label: "Accepted" },
      in_progress: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-400", icon: CheckCircle, label: "In Progress" },
      submitted: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", icon: Clock, label: "Under Review" },
      approved: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", icon: CheckCircle, label: "Approved" },
      rejected: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", icon: XCircle, label: "Rejected" },
    };

    const style = styles[status] || styles.pending;
    const Icon = style.icon;

    return (
      <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border", style.bg, style.text, "border-opacity-50")}>
        <Icon className="w-3 h-3" />
        {style.label}
      </span>
    );
  };

  const openModal = (type: string, item: any) => {
    setSelectedTask(item);
    if (type === 'accept') setIsAcceptModalOpen(true);
    if (type === 'submit') setIsSubmitModalOpen(true);
    if (type === 'extension') setIsExtensionModalOpen(true);
    if (type === 'chat') setIsChatOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingCount = tasks.filter(
    (t) => !t.submission || t.submission.status === "rejected" || t.assignment?.status === "assigned"
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Complete tasks to earn rewards"
        icon={ClipboardList}
        breadcrumbs={[{ label: "Tasks" }]}
      />

      {/* Summary Card */}
      <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Action Required
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {pendingCount}
            </p>
          </div>
          <div className="p-4 bg-primary/10 rounded-xl">
            <ClipboardList className="w-8 h-8 text-primary" />
          </div>
        </div>
      </Card>

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <Card className="p-8 text-center">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No tasks available at the moment
            </p>
          </Card>
        ) : (
          tasks.map((item) => {
            const { task, assignment, submission } = item;
            const Icon = task.type === "push_review" ? Star : ClipboardList;
            const currentStatus = submission?.status || assignment?.status || "pending";
            const isAssigned = assignment?.status === "assigned";
            const isInProgress = currentStatus === "accepted" || currentStatus === "in_progress";
            const isRejected = currentStatus === "rejected";
            const isSubmittedOrDone = currentStatus === "submitted" || currentStatus === "approved";

            return (
              <Card key={task.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={cn("p-3 rounded-xl", task.type === "push_review" ? "bg-amber-500/10" : "bg-primary/10")}>
                      <Icon className={cn("w-6 h-6", task.type === "push_review" ? "text-amber-500" : "text-primary")} />
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {task.title}
                        </h3>
                        {getStatusBadge(item)}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {task.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md">
                          ₹{task.reward_amount} Reward
                        </span>
                        {task.deadline && (
                          <span className="flex items-center gap-1 text-gray-500">
                            <Calendar className="w-3 h-3" />
                            Due: {new Date(submission?.new_deadline || task.deadline).toLocaleDateString()}
                          </span>
                        )}
                        {task.priority && (
                          <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-md border", priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.normal)}>
                            <Flag className="w-3 h-3" />
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-none border-gray-100 dark:border-gray-800">
                    {isAssigned && (
                      <Button size="sm" onClick={() => openModal('accept', item)} className="w-full md:w-auto bg-green-600 hover:bg-green-700">
                        <CheckCircle className="w-4 h-4 mr-2" /> Accept Task
                      </Button>
                    )}

                    {(isInProgress || isRejected) && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => openModal('extension', item)} className="w-full md:w-auto">
                          <Calendar className="w-4 h-4 mr-2" /> Need more time
                        </Button>
                        <Button size="sm" onClick={() => openModal('submit', item)} className="w-full md:w-auto">
                          <Upload className="w-4 h-4 mr-2" /> Submit Proof
                        </Button>
                      </>
                    )}

                    {(assignment || submission) && (
                      <Button size="sm" variant="ghost" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 w-full md:w-auto" onClick={() => openModal('chat', item)}>
                        <MessageCircle className="w-4 h-4 mr-2" /> Chat
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Modals */}
      {selectedTask && (
        <>
          <TaskAcceptModal
            isOpen={isAcceptModalOpen}
            onClose={() => setIsAcceptModalOpen(false)}
            task={selectedTask.task}
            assignmentId={selectedTask.assignment?.id}
            onSuccess={loadTasks}
          />

          <SubmitProofModal
            isOpen={isSubmitModalOpen}
            onClose={() => setIsSubmitModalOpen(false)}
            taskId={selectedTask.task.id}
            submissionId={selectedTask.submission?.id}
            taskTitle={selectedTask.task.title}
            onSuccess={loadTasks}
          />

          <DeadlineExtensionModal
            isOpen={isExtensionModalOpen}
            onClose={() => setIsExtensionModalOpen(false)}
            submissionId={selectedTask.submission?.id}
            taskTitle={selectedTask.task.title}
            currentDeadline={selectedTask.submission?.new_deadline || selectedTask.task.deadline}
            onSuccess={loadTasks}
          />

          <FreelancerTaskChat
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            taskId={selectedTask.task.id}
            submissionId={selectedTask.submission?.id}
            title={`Chat: ${selectedTask.task.title}`}
          />
        </>
      )}
    </div>
  );
}
