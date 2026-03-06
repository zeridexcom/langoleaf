"use client";

import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Chrome, Github } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login
    console.log("Login:", formData);
  };

  return (
    <div className="space-y-8">
      {/* Logo */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#6d28d9] to-[#22d3ee] flex items-center justify-center mb-4">
          <span className="text-white font-bold text-2xl">L</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
        <p className="text-gray-400 mt-2">
          Sign in to your freelancer account
        </p>
      </div>

      {/* Social Login */}
      <div className="grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl text-white hover:bg-[#252542] transition-colors">
          <Chrome className="w-5 h-5" />
          <span className="text-sm">Google</span>
        </button>
        <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl text-white hover:bg-[#252542] transition-colors">
          <Github className="w-5 h-5" />
          <span className="text-sm">GitHub</span>
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#2d2d4a]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#0f0f1a] px-2 text-gray-400">
            Or continue with email
          </span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full pl-11 pr-4 py-3 bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/50"
              placeholder="name@example.com"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full pl-11 pr-12 py-3 bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/50"
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-[#2d2d4a] bg-[#1a1a2e] text-[#6d28d9] focus:ring-[#6d28d9]"
            />
            <span className="text-sm text-gray-400">Remember me</span>
          </label>
          <a
            href="/forgot-password"
            className="text-sm text-[#6d28d9] hover:text-[#a78bfa] transition-colors"
          >
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-[#6d28d9] text-white font-medium rounded-xl hover:bg-[#6d28d9]/90 transition-colors"
        >
          Sign In
        </button>
      </form>

      {/* Sign Up Link */}
      <p className="text-center text-sm text-gray-400">
        Don't have an account?{" "}
        <a
          href="/signup"
          className="text-[#6d28d9] hover:text-[#a78bfa] font-medium transition-colors"
        >
          Sign up
        </a>
      </p>
    </div>
  );
}
