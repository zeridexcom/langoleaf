"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Star,
  Copy,
  Check,
  ExternalLink,
  Gift,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { reviewTemplates, categories } from "@/lib/data/review-templates";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface TaskSubmission {
  id: string;
  status: string;
  submission_data: {
    review_link?: string;
    review_text?: string;
  };
  created_at: string;
  review_notes?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  reward_amount: number;
  target_url?: string;
}

export default function PushReviewPage() {
  const [task, setTask] = useState<Task | null>(null);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewLink, setReviewLink] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showTemplates, setShowTemplates] = useState(true);
  const supabase = createClient();

  // Google review link for edufast.in
  const GOOGLE_REVIEW_URL = "https://www.google.com/maps/place/Edufast/@your-location";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get push review task
      const { data: taskData } = await supabase
        .from("tasks")
        .select("*")
        .eq("type", "push_review")
        .eq("is_active", true)
        .single();

      if (taskData) {
        setTask(taskData);

        // Get user's submissions for this task
        const { data: submissionData } = await supabase
          .from("task_submissions")
          .select("*")
          .eq("task_id", taskData.id)
          .eq("freelancer_id", user.id)
          .order("created_at", { ascending: false });

        setSubmissions(submissionData || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyTemplate = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("Review copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const handleSubmit = async () => {
    if (!reviewLink.trim()) {
      toast.error("Please enter your Google review link");
      return;
    }

    if (!reviewLink.includes("google")) {
      toast.error("Please enter a valid Google review link");
      return;
    }

    if (!task) {
      toast.error("Task not found");
      return;
    }

    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to submit");
        return;
      }

      // Check for pending submission
      const pendingSubmission = submissions.find(
        (s) => s.status === "submitted" || s.status === "pending"
      );
      if (pendingSubmission) {
        toast.error("You already have a pending submission");
        return;
      }

      // Submit the task
      const { error } = await supabase.from("task_submissions").insert({
        task_id: task.id,
        freelancer_id: user.id,
        submission_data: {
          review_link: reviewLink,
          template_id: selectedTemplate,
        },
        status: "submitted",
      });

      if (error) throw error;

      toast.success("Review submitted successfully! Waiting for admin approval.");
      setReviewLink("");
      setSelectedTemplate(null);
      loadData();
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(error.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter templates
  const filteredTemplates = reviewTemplates.filter((t) => {
    const matchesSearch =
      t.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get latest submission status
  const latestSubmission = submissions[0];
  const canSubmit =
    !latestSubmission ||
    latestSubmission.status === "approved" ||
    latestSubmission.status === "rejected";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Push Review Task"
        description="Submit a Google review for edufast.in and earn ₹20 per approved review!"
        icon={Star}
        breadcrumbs={[{ label: "Tasks" }, { label: "Push Review" }]}
      />

      {/* Reward Banner */}
      <Card className="p-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <Gift className="w-8 h-8 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Earn ₹{task?.reward_amount || 20} Per Review!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Submit your Google review link and get rewarded after admin
                verification
              </p>
            </div>
          </div>
          <Button
            onClick={() => window.open("https://edufast.in", "_blank")}
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Visit edufast.in
          </Button>
        </div>
      </Card>

      {/* Submission Status */}
      {latestSubmission && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Your Submission Status</h3>
          <div className="flex items-start gap-4">
            {latestSubmission.status === "submitted" && (
              <>
                <Clock className="w-6 h-6 text-amber-500" />
                <div>
                  <p className="font-medium text-amber-600">Pending Review</p>
                  <p className="text-sm text-gray-500">
                    Your submission is being reviewed by admin. You'll be notified
                    once approved.
                  </p>
                </div>
              </>
            )}
            {latestSubmission.status === "approved" && (
              <>
                <CheckCircle className="w-6 h-6 text-green-500" />
                <div>
                  <p className="font-medium text-green-600">Approved! 🎉</p>
                  <p className="text-sm text-gray-500">
                    ₹{task?.reward_amount || 20} has been credited to your account!
                  </p>
                </div>
              </>
            )}
            {latestSubmission.status === "rejected" && (
              <>
                <XCircle className="w-6 h-6 text-red-500" />
                <div>
                  <p className="font-medium text-red-600">Rejected</p>
                  <p className="text-sm text-gray-500">
                    {latestSubmission.review_notes ||
                      "Your submission was rejected. Please resubmit with a valid review link."}
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* How It Works */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
              1
            </div>
            <div>
              <p className="font-medium">Copy a Review</p>
              <p className="text-sm text-gray-500">
                Choose from 1000+ pre-made 5-star review templates below
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
              2
            </div>
            <div>
              <p className="font-medium">Post on Google</p>
              <p className="text-sm text-gray-500">
                Visit edufast.in Google page and paste your review
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
              3
            </div>
            <div>
              <p className="font-medium">Submit & Earn</p>
              <p className="text-sm text-gray-500">
                Paste your review link here and get ₹20 after verification
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Review Templates Section */}
      <Card className="p-6">
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="w-full flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-3">
            <Star className="w-6 h-6 text-amber-500" />
            <div className="text-left">
              <h3 className="text-lg font-semibold">
                1000+ 5-Star Review Templates
              </h3>
              <p className="text-sm text-gray-500">
                Click to copy any review template
              </p>
            </div>
          </div>
          {showTemplates ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showTemplates && (
          <>
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
              {filteredTemplates.slice(0, 100).map((template) => (
                <div
                  key={template.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedTemplate === template.id
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                  }`}
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    copyTemplate(template.text, template.id);
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <div className="flex gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className="w-3 h-3 fill-amber-400 text-amber-400"
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                        {template.text}
                      </p>
                    </div>
                    <button
                      className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
                      title="Copy review"
                    >
                      {copiedId === template.id ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <span className="text-xs text-gray-400 mt-2 inline-block capitalize">
                    {template.category}
                  </span>
                </div>
              ))}
            </div>

            {filteredTemplates.length > 100 && (
              <p className="text-center text-sm text-gray-500 mt-4">
                Showing 100 of {filteredTemplates.length} reviews. Use search to
                find more.
              </p>
            )}
          </>
        )}
      </Card>

      {/* Submission Form */}
      {canSubmit && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Submit Your Review</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Google Review Link *
              </label>
              <input
                type="url"
                placeholder="https://www.google.com/maps/reviews/..."
                value={reviewLink}
                onChange={(e) => setReviewLink(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste the URL of your Google review. You can find it by going to
                your review on Google Maps and copying the link.
              </p>
            </div>

            <div className="flex items-center gap-2 p-4 bg-amber-500/10 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Make sure your review is visible publicly. Admin will verify your
                review before crediting the reward.
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || !reviewLink.trim()}
              className="w-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Submit Review
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Previous Submissions */}
      {submissions.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Previous Submissions</h3>
          <div className="space-y-3">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium truncate max-w-md">
                    {sub.submission_data.review_link}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(sub.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    sub.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : sub.status === "rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
