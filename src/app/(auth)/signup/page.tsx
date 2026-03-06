"use client";

import { useState } from "react";
import { User, Mail, Lock, Eye, EyeOff, Chrome, Github, Phone } from "lucide-react";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    agreeTerms: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    } else {
      // Handle signup
      console.log("Signup:", formData);
    }
  };

  return (
    <div className="space-y-8">
      {/* Logo */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#6d28d9] to-[#22d3ee] flex items-center justify-center mb-4">
          <span className="text-white font-bold text-2xl">L</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Create Account</h1>
        <p className="text-gray-400 mt-2">
          Join as a freelancer partner
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        <div className={`flex-1 h-1 rounded-full ${step >= 1 ? "bg-[#6d28d9]" : "bg-[#2d2d4a]"}`} />
        <div className={`flex-1 h-1 rounded-full ${step >= 2 ? "bg-[#6d28d9]" : "bg-[#2d2d4a]"}`} />
      </div>

      {/* Social Signup */}
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
            Or sign up with email
          </span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {step === 1 ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/50"
                    placeholder="John"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/50"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

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
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/50"
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Create Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-11 pr-12 py-3 bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/50"
                  placeholder="Min 8 characters"
                  required
                  minLength={8}
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

            <div className="p-4 bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                  className="w-4 h-4 mt-0.5 rounded border-[#2d2d4a] bg-[#252542] text-[#6d28d9] focus:ring-[#6d28d9]"
                  required
                />
                <span className="text-sm text-gray-400">
                  I agree to the{" "}
                  <a href="/terms" className="text-[#6d28d9] hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="text-[#6d28d9] hover:underline">
                    Privacy Policy
                  </a>
                </span>
              </label>
            </div>
          </>
        )}

        <div className="flex gap-3">
          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-3 border border-[#2d2d4a] text-white font-medium rounded-xl hover:bg-[#1a1a2e] transition-colors"
            >
              Back
            </button>
          )}
          <button
            type="submit"
            className="flex-1 py-3 bg-[#6d28d9] text-white font-medium rounded-xl hover:bg-[#6d28d9]/90 transition-colors"
          >
            {step === 1 ? "Continue" : "Create Account"}
          </button>
        </div>
      </form>

      {/* Login Link */}
      <p className="text-center text-sm text-gray-400">
        Already have an account?{" "}
        <a
          href="/login"
          className="text-[#6d28d9] hover:text-[#a78bfa] font-medium transition-colors"
        >
          Sign in
        </a>
      </p>
    </div>
  );
}
