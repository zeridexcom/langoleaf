"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Plus, Pencil, Calendar, Flag, Users, MessageCircle, Check, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

interface Task {
  id: string;
  type: string;
  title: string;
  description: string | null;
  reward_amount: number;
  is_active: boolean;
  auto_assign: boolean;
  target_url: string | null;
  deadline: string | null;
  priority: string;
  category: string | null;
  admin_question: string | null;
}

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  onSuccess: () => void;
  showQuestionStep?: boolean;
}

interface Freelancer {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

const taskTypes = [
  { value: "push_review", label: "Push Review" },
  { value: "document_upload", label: "Document Upload" },
  { value: "profile_complete", label: "Profile Complete" },
  { value: "referral", label: "Referral" },
  { value: "social_share", label: "Social Share" },
  { value: "feedback", label: "Feedback" },
  { value: "custom", label: "Custom Task" },
];

const priorities = [
  { value: "urgent", label: "Urgent", color: "text-red-600 bg-red-50 border-red-200" },
  { value: "normal", label: "Normal", color: "text-amber-600 bg-amber-50 border-amber-200" },
  { value: "low", label: "Low", color: "text-green-600 bg-green-50 border-green-200" },
];

const categories = ["Marketing", "Content", "Review", "Documentation", "Social Media", "Research", "Other"];

export function TaskCreateModal({ isOpen, onClose, task, onSuccess, showQuestionStep }: TaskCreateModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [selectedFreelancers, setSelectedFreelancers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingFreelancers, setLoadingFreelancers] = useState(false);

  const [formData, setFormData] = useState({
    type: "push_review",
    title: "",
    description: "",
    reward_amount: 50,
    target_url: "",
    auto_assign: true,
    is_active: true,
    deadline: "",
    priority: "normal" as "urgent" | "normal" | "low",
    category: "",
    admin_question: "",
  });

  const supabase = createClient();

  useEffect(() => {
    if (isOpen && step === 2) loadFreelancers();
  }, [isOpen, step]);

  const loadFreelancers = async () => {
    setLoadingFreelancers(true);
    try {
      const { data } = await supabase.from("profiles").select("id, full_name, email, avatar_url").eq("role", "freelancer").order("full_name");
      if (data) setFreelancers(data);
    } catch (error) {
      console.error("Error loading freelancers:", error);
    } finally {
      setLoadingFreelancers(false);
    }
  };

  useEffect(() => {
    if (task) {
      setFormData({
        type: task.type || "push_review",
        title: task.title || "",
        description: task.description || "",
        reward_amount: task.reward_amount || 50,
        target_url: task.target_url || "",
        auto_assign: task.auto_assign ?? true,
        is_active: task.is_active ?? true,
        deadline: task.deadline ? task.deadline.split("T")[0] : "",
        priority: (task.priority as any) || "normal",
        category: task.category || "",
        admin_question: task.admin_question || "",
      });
    } else {
      resetForm();
    }
  }, [task]);

  const resetForm = () => {
    setFormData({ type: "push_review", title: "", description: "", reward_amount: 50, target_url: "", auto_assign: true, is_active: true, deadline: "", priority: "normal", category: "", admin_question: "" });
    setSelectedFreelancers([]);
    setStep(1);
    setCreatedTaskId(null);
  };

  const handleCreateTask = async () => {
    if (!formData.title.trim()) { toast.error("Title is required"); return; }
    setLoading(true);
    try {
      const body: any = { ...formData, deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null };
      if (task) body.id = task.id;

      const response = await fetch("/api/admin/tasks", { method: task ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save task");

      if (!task) {
        setCreatedTaskId(data.task.id);
        if (!formData.auto_assign) { setStep(2); setLoading(false); return; }
        if (showQuestionStep !== false) { setStep(3); setLoading(false); return; }
      }
      toast.success(task ? "Task updated" : "Task created");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to save task");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignFreelancers = async () => {
    if (selectedFreelancers.length === 0) { toast.error("Select at least one freelancer"); return; }
    setLoading(true);
    try {
      let taskIdToUse = createdTaskId;
      if (!taskIdToUse) {
        const response = await fetch("/api/admin/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...formData, auto_assign: false, deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        taskIdToUse = data.task.id;
        setCreatedTaskId(taskIdToUse);
      }

      const assignResponse = await fetch("/api/admin/tasks/assign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ taskId: taskIdToUse, freelancerIds: selectedFreelancers }) });
      const assignData = await assignResponse.json();
      if (!assignResponse.ok) throw new Error(assignData.error);

      if (showQuestionStep !== false) { setStep(3); setLoading(false); return; }
      toast.success(`Task assigned to ${assignData.assigned} freelancer(s)`);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to assign task");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestion = async () => {
    if (createdTaskId && formData.admin_question) {
      await fetch("/api/admin/tasks", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: createdTaskId, admin_question: formData.admin_question }) });
    }
    toast.success("Task created successfully!");
    onSuccess();
    onClose();
  };

  const toggleFreelancer = (id: string) => setSelectedFreelancers((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  const selectAllFreelancers = () => setSelectedFreelancers(selectedFreelancers.length === freelancers.length ? [] : freelancers.map((f) => f.id));
  const filteredFreelancers = freelancers.filter((f) => f.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || f.email.toLowerCase().includes(searchQuery.toLowerCase()));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              {task ? <Pencil className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{task ? "Edit Task" : step === 1 ? "Create Task" : step === 2 ? "Assign Freelancers" : "Add Question"}</h2>
              <p className="text-sm text-gray-500">{task ? "Update task details" : step === 1 ? "Add a new task" : step === 2 ? "Select recipients" : "Ask a question"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        {!task && (
          <div className="flex items-center justify-center gap-2 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium", step >= s ? "bg-primary text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500")}>{s}</div>
                {s < 3 && <div className={cn("w-12 h-1 rounded-full", step > s ? "bg-primary" : "bg-gray-200 dark:bg-gray-700")} />}
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {step === 1 && (
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Task Type</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                  {taskTypes.map((type) => (<option key={type.value} value={type.value}>{type.label}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title <span className="text-red-500">*</span></label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Submit Google Review" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe what the freelancer needs to do..." rows={3} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reward (₹)</label>
                  <input type="number" value={formData.reward_amount} onChange={(e) => setFormData({ ...formData, reward_amount: parseInt(e.target.value) || 0 })} min={0} step={10} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="">Select</option>
                    {categories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"><Calendar className="w-4 h-4 inline mr-1" />Deadline</label>
                  <input type="date" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} min={new Date().toISOString().split("T")[0]} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"><Flag className="w-4 h-4 inline mr-1" />Priority</label>
                  <div className="flex gap-2">
                    {priorities.map((p) => (
                      <button key={p.value} type="button" onClick={() => setFormData({ ...formData, priority: p.value as any })} className={cn("flex-1 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors", formData.priority === p.value ? p.color : "bg-gray-50 dark:bg-gray-700 text-gray-600 border-gray-200")}>{p.label}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target URL</label>
                <input type="url" value={formData.target_url} onChange={(e) => setFormData({ ...formData, target_url: e.target.value })} placeholder="https://example.com" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"><MessageCircle className="w-4 h-4 inline mr-1" />Question for Freelancer</label>
                <textarea value={formData.admin_question} onChange={(e) => setFormData({ ...formData, admin_question: e.target.value })} placeholder="Ask a question the freelancer must answer..." rows={2} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={formData.auto_assign} onChange={(e) => setFormData({ ...formData, auto_assign: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Auto-assign to all freelancers</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="p-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search freelancers..." className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{selectedFreelancers.length} selected</span>
                <button onClick={selectAllFreelancers} className="text-sm text-primary hover:underline">
                  {selectedFreelancers.length === freelancers.length ? "Deselect all" : "Select all"}
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-600 rounded-xl p-3">
                {loadingFreelancers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : filteredFreelancers.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No freelancers found</p>
                ) : (
                  filteredFreelancers.map((freelancer) => (
                    <button
                      key={freelancer.id}
                      onClick={() => toggleFreelancer(freelancer.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left",
                        selectedFreelancers.includes(freelancer.id)
                          ? "bg-primary/10 border border-primary/30"
                          : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                      )}
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
                        {freelancer.avatar_url ? (
                          <img src={freelancer.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{freelancer.full_name}</p>
                        <p className="text-sm text-gray-500 truncate">{freelancer.email}</p>
                      </div>
                      {selectedFreelancers.includes(freelancer.id) && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Add an optional question that the freelancer must answer when accepting this task.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MessageCircle className="w-4 h-4 inline mr-1" />
                  Question for Freelancer
                </label>
                <textarea
                  value={formData.admin_question}
                  onChange={(e) => setFormData({ ...formData, admin_question: e.target.value })}
                  placeholder="e.g., What is your experience with this type of task?"
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
              <p className="text-xs text-gray-500">Leave empty to skip this step</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <button
            onClick={() => {
              if (step > 1 && !task) setStep(step - 1);
              else onClose();
            }}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            {step > 1 && !task ? "Back" : "Cancel"}
          </button>
          <div className="flex gap-3">
            {step === 1 && task && (
              <button
                onClick={handleCreateTask}
                disabled={loading}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Update Task
              </button>
            )}
            {step === 1 && !task && (
              <button
                onClick={handleCreateTask}
                disabled={loading || !formData.title.trim()}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Continue
              </button>
            )}
            {step === 2 && (
              <button
                onClick={handleAssignFreelancers}
                disabled={loading || selectedFreelancers.length === 0}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Assign to {selectedFreelancers.length} Freelancer{selectedFreelancers.length !== 1 ? "s" : ""}
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleSaveQuestion}
                disabled={loading}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Complete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}