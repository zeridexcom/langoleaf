"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Chrome, 
  Phone,
  School,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    agreeTerms: false,
  });
  const supabase = createClient();

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setErrorMessage(null);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        console.error('Google sign up error:', error);
        
        // Handle specific error cases
        if (error.message?.includes('provider is not enabled') || error.code === 'validation_failed') {
          setErrorMessage('Google signup is not enabled. Please contact the administrator or use email signup.');
        } else {
          setErrorMessage(error.message || 'Failed to sign up with Google. Please try again.');
        }
        
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Unexpected error during Google sign up:', err);
      
      // Try to parse error from various formats
      let errorMsg = '';
      let errorCode = '';
      
      if (typeof err === 'string') {
        errorMsg = err;
        // Try to parse as JSON
        try {
          const parsed = JSON.parse(err);
          errorMsg = parsed.msg || parsed.message || err;
          errorCode = parsed.error_code || parsed.code || '';
        } catch (e) {
          // Not JSON, use as is
        }
      } else if (err?.message) {
        errorMsg = err.message;
        // Try to parse if message contains JSON
        try {
          const parsed = JSON.parse(err.message);
          errorMsg = parsed.msg || parsed.message || err.message;
          errorCode = parsed.error_code || parsed.code || '';
        } catch (e) {
          // Not JSON, use as is
        }
      } else if (err?.msg) {
        errorMsg = err.msg;
        errorCode = err.error_code || err.code || '';
      } else {
        errorMsg = JSON.stringify(err);
      }
      
      // Check for the specific error patterns
      if (errorMsg?.includes('provider is not enabled') || 
          errorMsg?.includes('Unsupported provider') ||
          errorCode === 'validation_failed' ||
          err?.error_code === 'validation_failed' ||
          err?.code === 'validation_failed') {
        setErrorMessage('Google signup is not enabled. Please contact the administrator or use email signup.');
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
      
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    } else {
      setLoading(true);
      // Handle email signup with Supabase
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
          },
        },
      });

      if (error) {
        console.error('Signup error:', error);
        setLoading(false);
        return;
      }

      window.location.href = "/";
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <School className="w-8 h-8 text-primary" />
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            freelancer.<span className="text-primary">langoleaf</span>
          </h2>
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Create Account</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
          Join as a freelancer partner
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        <div className={`flex-1 h-2 border-2 ${step >= 1 ? "bg-primary border-primary" : "bg-slate-200 dark:bg-slate-800 border-dark-border"}`} />
        <div className={`flex-1 h-2 border-2 ${step >= 2 ? "bg-primary border-primary" : "bg-slate-200 dark:bg-slate-800 border-dark-border"}`} />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-none flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Social Signup */}
      <button 
        onClick={handleGoogleSignUp}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-dark-surface border-2 border-dark-border text-slate-700 dark:text-slate-200 hover:border-primary/50 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 font-bold mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Chrome className="w-5 h-5" />
        <span className="text-sm">{loading ? 'Loading...' : 'Continue with Google'}</span>
      </button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-dark-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background-light dark:bg-background-dark px-2 text-slate-500 font-black tracking-wider">
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
                <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-dark-surface border-2 border-dark-border text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium"
                    placeholder="John"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-dark-surface border-2 border-dark-border text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-dark-surface border-2 border-dark-border text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-dark-surface border-2 border-dark-border text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium"
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                Create Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-11 pr-12 py-3 bg-white dark:bg-dark-surface border-2 border-dark-border text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium"
                  placeholder="Min 8 characters"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="p-4 border-2 border-dark-border bg-dark-surface">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                  className="w-4 h-4 mt-0.5 border-2 border-dark-border bg-white dark:bg-dark-surface text-primary focus:ring-primary"
                  required
                />
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline font-bold">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:underline font-bold">
                    Privacy Policy
                  </Link>
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
              className="flex-1 py-4 border-2 border-dark-border text-slate-700 dark:text-slate-200 font-black text-lg hover:bg-slate-100 dark:hover:bg-dark-elevated transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" /> Back
            </button>
          )}
          <button
            type="submit"
            className="flex-1 py-4 bg-primary text-white font-black text-lg border-2 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            {step === 1 ? (
              <>Continue <ArrowRight className="w-5 h-5" /></>
            ) : (
              <>Create Account <CheckCircle className="w-5 h-5" /></>
            )}
          </button>
        </div>
      </form>

      {/* Ecosystem Mention */}
      <div className="mt-6 p-4 border-2 border-primary/20 bg-primary/5 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          Join the <span className="font-black text-primary">Langoleaf Ecosystem</span>. One account for all your freelance projects, translations, and collaboration tools.
        </p>
      </div>

      {/* Login Link */}
      <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6 font-medium">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-primary hover:text-primary/80 font-black transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
