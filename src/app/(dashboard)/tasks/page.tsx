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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Task {
  id: string;
  type: string;
  title: string;
  description: string;
  reward_amount: number;
  is_active: boolean;
}

interface TaskWithStatus {
  task: Task;
  hasSubmitted: boolean;
  submission?: {
    id: string;
    status: string;
    created_at: string;
  };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get all active tasks
      const { data: taskData } = await supabase
        .from("tasks")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (!taskData) return;

      // Get user's submissions
      const { data: submissions } = await supabase
        .from("task_submissions")
        .select("*")
        .eq("freelancer_id", user.id);

      // Map tasks with status
      const tasksWithStatus: TaskWithStatus[] = taskData.map((task) => {
        const submission = submissions?.find((s) => s.task_id === task.id);
        return {
          task,
          hasSubmitted: !!submission,
          submission: submission
            ? {
                id: submission.id,
                status: submission.status,
                created_at: submission.created_at,
              }
            : undefined,
        };
      });

      setTasks(tasksWithStatus);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    const styles: Record<string, { bg: string; text: string; icon: any }> = {
      submitted: {
        bg: "bg-amber-100 dark:bg-amber-500/10",
        text: "text-amber-700 dark:text-amber-400",
        icon: Clock,
      },
      approved: {
        bg: "bg-green-100 dark:bg-green-500/10",
        text: "text-green-700 dark:text-green-400",
        icon: CheckCircle,
      },
      rejected: {
        bg: "bg-red-100 dark:bg-red-500/10",
        text: "text-red-700 dark:text-red-400",
        icon: XCircle,
      },
    };

    const style = styles[status] || styles.submitted;
    const Icon = style.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
      >
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case "push_review":
        return Star;
      default:
        return ClipboardList;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingCount = tasks.filter(
    (t) => !t.hasSubmitted || t.submission?.status === "rejected"
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
              Pending Tasks
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
          tasks.map(({ task, hasSubmitted, submission }) => {
            const Icon = getTaskIcon(task.type);
            const isPending = !hasSubmitted || submission?.status === "rejected";

            return (
              <Card
                key={task.id}
                className="p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-xl ${
                        task.type === "push_review"
                          ? "bg-amber-500/10"
                          : "bg-primary/10"
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${
                          task.type === "push_review"
                            ? "text-amber-500"
                            : "text-primary"
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {task.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {task.description}
                      </p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          ₹{task.reward_amount} Reward
                        </span>
                        {getStatusBadge(submission?.status)}
                      </div>
                    </div>
                  </div>

                  <Link href={`/tasks/${task.type.replace("_", "-")}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      {isPending ? "Start Task" : "View Details"}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
