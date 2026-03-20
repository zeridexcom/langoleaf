"use client";

import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "./admin-layout";
import {
  useSupportTickets,
  useSupportMessages,
} from "@/hooks/useAdminRealtime";
import {
  MessageSquare,
  Search,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Loader2,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export function SupportChatPage() {
  const { tickets, loading, updateTicketStatus } = useSupportTickets();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.freelancer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.freelancer_email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-4">
        {/* Tickets List */}
        <div className="w-full lg:w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-bold text-gray-900 dark:text-white mb-3">
              Support Tickets
            </h2>
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Tickets</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Tickets List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 mx-auto animate-spin text-primary" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tickets found</p>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={cn(
                    "w-full p-4 text-left border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",
                    selectedTicketId === ticket.id &&
                      "bg-primary/5 border-l-2 border-l-primary"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {ticket.subject}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {ticket.freelancer_name || ticket.freelancer_email}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full",
                        ticket.status === "open"
                          ? "bg-red-100 text-red-700"
                          : ticket.status === "in_progress"
                          ? "bg-yellow-100 text-yellow-700"
                          : ticket.status === "resolved"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      )}
                    >
                      {ticket.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {new Date(ticket.updated_at).toLocaleString()}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col">
          {selectedTicket ? (
            <ChatArea
              ticket={selectedTicket}
              onUpdateStatus={updateTicketStatus}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Select a ticket to start chatting</p>
                <p className="text-sm mt-1">
                  Choose from the list on the left
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

interface ChatAreaProps {
  ticket: any;
  onUpdateStatus: (id: string, status: "open" | "in_progress" | "resolved" | "closed") => Promise<boolean>;
}

function ChatArea({ ticket, onUpdateStatus }: ChatAreaProps) {
  const { messages, loading, sending, sendMessage } = useSupportMessages(
    ticket.id
  );
  const [newMessage, setNewMessage] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    const success = await sendMessage(newMessage);
    if (success) {
      setNewMessage("");
    }
  };

  const handleStatusChange = async (status: "open" | "in_progress" | "resolved" | "closed") => {
    setStatusUpdating(true);
    await onUpdateStatus(ticket.id, status);
    setStatusUpdating(false);
  };

  return (
    <>
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">
              {ticket.subject}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <User className="w-4 h-4" />
              <span>{ticket.freelancer_name || ticket.freelancer_email}</span>
              <span className="text-gray-300">•</span>
              <span className={cn(
                "font-medium",
                ticket.priority === "urgent"
                  ? "text-red-500"
                  : ticket.priority === "high"
                  ? "text-orange-500"
                  : "text-gray-500"
              )}>
                {ticket.priority} priority
              </span>
            </div>
          </div>
          <select
            value={ticket.status}
            onChange={(e) => handleStatusChange(e.target.value as "open" | "in_progress" | "resolved" | "closed")}
            disabled={statusUpdating}
            className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.sender_type === "admin" && "flex-row-reverse"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  message.sender_type === "admin"
                    ? "bg-primary text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                )}
              >
                {message.sender_type === "admin" ? (
                  <span className="text-xs font-bold">A</span>
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <div
                className={cn(
                  "max-w-[70%] rounded-2xl px-4 py-2",
                  message.sender_type === "admin"
                    ? "bg-primary text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                <p
                  className={cn(
                    "text-xs mt-1",
                    message.sender_type === "admin"
                      ? "text-white/70"
                      : "text-gray-500"
                  )}
                >
                  {new Date(message.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
            className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
