"use client";

import { useState } from "react";
import { Bell, Check, Trash2, UserPlus, FileCheck, Coins, Award, AlertCircle, CheckCircle } from "lucide-react";

const notifications = [
  {
    id: 1,
    type: "student_added",
    title: "New Student Added",
    message: "Rahul Sharma has been successfully added to your leads.",
    time: "2 hours ago",
    read: false,
    icon: UserPlus,
    color: "text-[#ec5b13]",
    bgColor: "bg-[#ec5b13]/10",
  },
  {
    id: 2,
    type: "application_submitted",
    title: "Application Submitted",
    message: "Application for Priya Patel has been submitted to IIT Delhi.",
    time: "5 hours ago",
    read: false,
    icon: FileCheck,
    color: "text-[#22d3ee]",
    bgColor: "bg-[#22d3ee]/10",
  },
  {
    id: 3,
    type: "coins_earned",
    title: "Coins Earned!",
    message: "You earned 500 coins for successful enrollment of Amit Kumar.",
    time: "1 day ago",
    read: true,
    icon: Coins,
    color: "text-[#fbbf24]",
    bgColor: "bg-[#fbbf24]/10",
  },
  {
    id: 4,
    type: "badge_earned",
    title: "New Badge Unlocked",
    message: "Congratulations! You've earned the 'Rising Star' badge.",
    time: "2 days ago",
    read: true,
    icon: Award,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  {
    id: 5,
    type: "action_required",
    title: "Action Required",
    message: "Documents are pending for Sneha Gupta. Please follow up.",
    time: "3 days ago",
    read: true,
    icon: AlertCircle,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
  {
    id: 6,
    type: "application_approved",
    title: "Application Approved",
    message: "Great news! Application for Vikram Singh has been approved.",
    time: "4 days ago",
    read: true,
    icon: CheckCircle,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
];

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filteredNotifications = filter === "unread" 
    ? notifications.filter(n => !n.read) 
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-gray-400 mt-1">
            You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
            <Check className="w-4 h-4" />
            Mark all as read
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-colors">
            <Trash2 className="w-4 h-4" />
            Clear all
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-dark-border">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            filter === "all"
              ? "text-[#ec5b13] border-[#ec5b13]"
              : "text-gray-400 border-transparent hover:text-white"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            filter === "unread"
              ? "text-[#ec5b13] border-[#ec5b13]"
              : "text-gray-400 border-transparent hover:text-white"
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-[#ec5b13] text-white text-xs rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start gap-4 p-4 bg-dark-surface border border-dark-border rounded-xl hover:bg-[#252542] transition-colors ${
              !notification.read ? "border-l-4 border-l-[#ec5b13]" : ""
            }`}
          >
            <div className={`p-3 rounded-xl ${notification.bgColor} flex-shrink-0`}>
              <notification.icon className={`w-5 h-5 ${notification.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className={`text-sm font-medium ${!notification.read ? "text-white" : "text-gray-300"}`}>
                    {notification.title}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
                </div>
                {!notification.read && (
                  <span className="w-2 h-2 bg-[#ec5b13] rounded-full flex-shrink-0 mt-1" />
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredNotifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No notifications found</p>
          </div>
        )}
      </div>
    </div>
  );
}
