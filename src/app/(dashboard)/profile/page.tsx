"use client";

import { useState } from "react";
import { User, Mail, Phone, MapPin, Camera, Award, Star, TrendingUp } from "lucide-react";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-gray-400 mt-1">Manage your account and view your achievements</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-2xl p-6 text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#6d28d9] to-[#22d3ee] flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-3xl">JD</span>
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-[#252542] rounded-full border border-[#2d2d4a] hover:bg-[#2d2d4a] transition-colors">
                <Camera className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <h2 className="text-xl font-bold text-white mt-4">John Doe</h2>
            <p className="text-gray-400">Freelancer Agent #1234</p>
            
            <div className="flex items-center justify-center gap-1 mt-2">
              <Star className="w-4 h-4 text-[#fbbf24] fill-[#fbbf24]" />
              <span className="text-sm text-white font-medium">4.8</span>
              <span className="text-sm text-gray-400">(24 reviews)</span>
            </div>

            <div className="mt-6 pt-6 border-t border-[#2d2d4a]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">Current Tier</span>
                <span className="text-sm font-medium text-[#6d28d9]">Silver Agent</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Success Rate</span>
                <span className="text-sm font-medium text-emerald-400">78%</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-2xl p-6 mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Performance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#6d28d9]/10 rounded-lg">
                    <User className="w-4 h-4 text-[#6d28d9]" />
                  </div>
                  <span className="text-sm text-gray-400">Students Added</span>
                </div>
                <span className="text-sm font-medium text-white">156</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-sm text-gray-400">Enrollments</span>
                </div>
                <span className="text-sm font-medium text-white">89</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#fbbf24]/10 rounded-lg">
                    <Award className="w-4 h-4 text-[#fbbf24]" />
                  </div>
                  <span className="text-sm text-gray-400">Total Earnings</span>
                </div>
                <span className="text-sm font-medium text-white">₹2,45,000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Form */}
        <div className="lg:col-span-2">
          <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Personal Information</h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 bg-[#6d28d9] text-white text-sm font-medium rounded-lg hover:bg-[#6d28d9]/90 transition-colors"
              >
                {isEditing ? "Save Changes" : "Edit Profile"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    defaultValue="John Doe"
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-3 bg-[#252542] border border-[#2d2d4a] rounded-xl text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    defaultValue="john.doe@example.com"
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-3 bg-[#252542] border border-[#2d2d4a] rounded-xl text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="tel"
                    defaultValue="+91 98765 43210"
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-3 bg-[#252542] border border-[#2d2d4a] rounded-xl text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    defaultValue="Mumbai, India"
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-3 bg-[#252542] border border-[#2d2d4a] rounded-xl text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/50"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">Bio</label>
              <textarea
                rows={4}
                defaultValue="Experienced education consultant helping students find the right programs for their career goals."
                disabled={!isEditing}
                className="w-full px-4 py-3 bg-[#252542] border border-[#2d2d4a] rounded-xl text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/50 resize-none"
              />
            </div>
          </div>

          {/* Badges */}
          <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-2xl p-6 mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Achievements</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: "Rising Star", icon: "⭐", color: "from-yellow-400 to-orange-500" },
                { name: "Top Performer", icon: "🏆", color: "from-[#6d28d9] to-[#22d3ee]" },
                { name: "100 Students", icon: "👥", color: "from-emerald-400 to-teal-500" },
                { name: "5-Star Rating", icon: "⭐", color: "from-pink-400 to-rose-500" },
              ].map((badge) => (
                <div key={badge.name} className="text-center p-4 bg-[#252542] rounded-xl">
                  <div className={`w-12 h-12 mx-auto rounded-full bg-gradient-to-br ${badge.color} flex items-center justify-center text-2xl mb-2`}>
                    {badge.icon}
                  </div>
                  <p className="text-xs text-gray-400">{badge.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
