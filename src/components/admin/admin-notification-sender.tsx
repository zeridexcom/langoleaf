"use client";

import { useState } from "react";
import { Bell, Send, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

export function AdminNotificationSender() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [lastSent, setLastSent] = useState<{ title: string; count: number } | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      toast.error("Please fill in both title and message");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, type: "system" }),
      });

      if (!response.ok) throw new Error("Failed to send notifications");

      const data = await response.json();
      toast.success(`Broadcasting to ${data.count} freelancers`);
      setLastSent({ title, count: data.count });
      setTitle("");
      setMessage("");
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Failed to send notification");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">Broadcast Notification</h2>
          <p className="text-xs text-gray-500 font-medium tracking-tight">Send a message to all active freelancers</p>
        </div>
      </div>

      <form onSubmit={handleSend} className="space-y-4">
        <div>
          <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">
            Notification Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Important System Update"
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">
            Message Content
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter the broadcast message..."
            rows={4}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-medium"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={isSending}
          className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Broadcast
            </>
          )}
        </Button>
      </form>

      {lastSent && (
        <div className="mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
          <div>
            <p className="text-xs font-black text-emerald-900 uppercase tracking-wide">Successfully Sent</p>
            <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
              &quot;{lastSent.title}&quot; was sent to {lastSent.count} freelancers.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
