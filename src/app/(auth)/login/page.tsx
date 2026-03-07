"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Chrome, 
  School,
  ArrowRight,
  AlertCircle
} from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
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
        console.error('Google sign in error:', error);
        
        // Handle specific error cases
        if (error.message?.includes('provider is not enabled') || error.code === 'validation_failed') {
          setErrorMessage('Google login is not enabled. Please contact the administrator or use email login.');
        } else {
          setErrorMessage(error.message || 'Failed to sign in with Google. Please try again.');
        }
        
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Unexpected error during Google sign in:', err);
      
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
        setErrorMessage('Google login is not enabled. Please contact the administrator or use email login.');
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
      
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      console.error('Login error:', error);
      setLoading(false);
      return;
    }

    window.location.href = "/";
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
        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Welcome Back</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
          Log in to your freelancer account to continue
        </p>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Social Login */}
      <button 
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-dark-surface border-2 border-dark-border text-slate-700 dark:text-slate-200 hover:border-primary/50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 rounded-2xl font-bold mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Chrome className="w-5 h-5 text-primary" />
        <span className="text-sm">{loading ? 'Loading...' : 'Continue with Google'}</span>
      </button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-dark-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background-light dark:bg-background-dark px-2 text-slate-500 font-black tracking-wider">
            Or continue with email
          </span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-dark-surface border-2 border-dark-border text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium rounded-xl"
              placeholder="name@company.com"
              required
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:text-primary/80 font-bold"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full pl-11 pr-12 py-3 bg-white dark:bg-dark-surface border-2 border-dark-border text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium rounded-xl"
              placeholder="••••••••"
              required
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

        <button
          type="submit"
          className="w-full py-4 bg-primary text-white font-black text-lg border-2 border-primary shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 rounded-2xl"
        >
          Sign In <ArrowRight className="w-5 h-5" />
        </button>
      </form>

      {/* Ecosystem Mention */}
      <div className="mt-6 p-4 border-2 border-primary/20 bg-primary/5 text-center rounded-2xl">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          By logging in, you access the full <span className="font-black text-primary">Langoleaf Ecosystem</span>. One account for all your freelance projects, translations, and collaboration tools.
        </p>
      </div>

      {/* Sign Up Link */}
      <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6 font-medium">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-primary hover:text-primary/80 font-black transition-colors"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
