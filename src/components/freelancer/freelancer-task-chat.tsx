"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Send,
  Loader2,
  User,
  Paperclip,
  Image as ImageIcon,
  File,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface FreelancerTaskChatProps {
  taskId: string;
  submissionId?: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  currentUserId?: string; // Add current user ID to distinguish "me" reliably
}

interface ChatMessage {
  id: string;
  task_id: string;
  submission_id: string | null;
  sender_id: string | null;
  message: string;
  attachments: {
    name: string;
    url: string;
    size?: number;
    type?: string;
  }[];
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    role: string;
  };
}

export function FreelancerTaskChat({
  taskId,
  submissionId,
  isOpen,
  onClose,
  title = "Chat with Admin",
  currentUserId,
}: FreelancerTaskChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Determine user ID if not explicitly passed
  const [userId, setUserId] = useState<string | undefined>(currentUserId);

  useEffect(() => {
    if (!currentUserId && isOpen) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) setUserId(data.user.id);
      });
    }
  }, [currentUserId, isOpen, supabase]);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ taskId });
      if (submissionId) params.append("submissionId", submissionId);

      const response = await fetch(`/api/tasks/chat?${params}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setMessages(data.chats || []);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [taskId, submissionId]);

  useEffect(() => {
    if (isOpen) {
      loadMessages();
    }
  }, [isOpen, loadMessages]);

  // Real-time subscription
  useEffect(() => {
    if (!isOpen) return;

    const channel = supabase
      .channel(`task-chat-${taskId}-${submissionId || "general"}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "task_chats",
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          if (submissionId && newMsg.submission_id !== submissionId) return;
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, taskId, submissionId, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !userId) return;

    setSending(true);
    try {
      const response = await fetch("/api/tasks/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          submissionId,
          message: newMessage.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setMessages((prev) => [...prev, data.chat]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: string) => {
    const msgDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (msgDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (msgDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return msgDate.toLocaleDateString();
    }
  };

  const getAttachmentIcon = (type?: string) => {
    if (type?.startsWith("image/")) return ImageIcon;
    return File;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">
              {title}
            </h3>
            <p className="text-xs text-gray-500">Live Support</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
              <User className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">Start chatting with an admin</p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              // Now "isMe" means the freelancer (so they appear on the right)
              const isMe = msg.sender?.role === "freelancer" || msg.sender_id === userId;
              
              const showDate =
                index === 0 ||
                formatDate(messages[index - 1].created_at) !==
                  formatDate(msg.created_at);

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex items-center justify-center my-4">
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-500 rounded-full">
                        {formatDate(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <div
                    className={cn(
                      "flex gap-2",
                      isMe ? "justify-end" : "justify-start"
                    )}
                  >
                    {!isMe && (
                      <div className="w-6 h-6 flex-shrink-0 bg-primary/10 rounded-full flex items-center justify-center mt-auto">
                        <User className="w-3 h-3 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] px-3 py-2 text-sm",
                        isMe
                          ? "bg-primary text-white rounded-2xl rounded-br-sm"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl rounded-bl-sm"
                      )}
                    >
                      {!isMe && msg.sender?.full_name && (
                        <p className="text-[10px] font-bold text-primary mb-0.5">
                          {msg.sender.full_name} (Admin)
                        </p>
                      )}
                      <p className="break-words">{msg.message}</p>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.attachments.map((att, i) => {
                            const Icon = getAttachmentIcon(att.type);
                            return (
                              <a
                                key={i}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                  "flex items-center gap-2 p-2 rounded-lg text-xs",
                                  isMe
                                    ? "bg-white/20 text-white"
                                    : "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                                )}
                              >
                                <Icon className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate flex-1">{att.name}</span>
                                <Download className="w-3 h-3 flex-shrink-0" />
                              </a>
                            );
                          })}
                        </div>
                      )}
                      <p
                        className={cn(
                          "text-xs mt-1 text-right",
                          isMe ? "text-white/70" : "text-gray-400"
                        )}
                      >
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={handleSendMessage}
            disabled={sending || !newMessage.trim() || !userId}
            className="p-2 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
