"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  School, 
  Globe, 
  TrendingUp, 
  Zap, 
  Users, 
  Award, 
  ArrowRight, 
  CheckCircle,
  Building2,
  Wallet,
  Clock,
  MapPin
} from "lucide-react";

function AuthCodeRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // If we land here with an auth code, redirect to the callback handler
    const code = searchParams.get("code");
    if (code && !isRedirecting) {
      setIsRedirecting(true);
      // Use window.location.replace for a full page redirect (no history entry)
      window.location.replace(`/auth/callback?code=${code}`);
    }
  }, [searchParams, router, isRedirecting]);

  // Show loading state while redirecting
  if (isRedirecting) {
    return (
      <div className="fixed inset-0 bg-background-light dark:bg-background-dark flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Authenticating...</p>
        </div>
      </div>
    );
  }

  return null;
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <Suspense fallback={null}>
        <AuthCodeRedirect />
      </Suspense>
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-dark-border bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-2">
              <div className="text-primary flex items-center justify-center">
                <School className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                freelancer.<span className="text-primary">langoleaf</span>
              </h2>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#partnerships" className="text-sm font-bold hover:text-primary transition-colors uppercase tracking-wide">
                Partnerships
              </Link>
              <Link href="#commissions" className="text-sm font-bold hover:text-primary transition-colors uppercase tracking-wide">
                Commissions
              </Link>
              <Link href="#tools" className="text-sm font-bold hover:text-primary transition-colors uppercase tracking-wide">
                Tools
              </Link>
              <Link href="#about" className="text-sm font-bold hover:text-primary transition-colors uppercase tracking-wide">
                About
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link 
                href="/login"
                className="hidden sm:flex px-5 py-2.5 text-sm font-bold border-2 border-dark-border bg-white dark:bg-dark-surface hover:bg-slate-100 dark:hover:bg-dark-elevated transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 rounded-xl"
              >
                Log In
              </Link>
              <Link 
                href="/signup"
                className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 text-sm font-bold border-2 border-primary shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all rounded-xl"
              >
                Join Now
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-24 lg:pb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="flex flex-col gap-8">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-2 border-2 border-primary/30 w-fit rounded-full">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-wider">A Sub-brand of Langoleaf.com</span>
                </div>
                <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight text-slate-900 dark:text-white uppercase">
                  Empowering <span className="text-primary">Education Agents</span> Globally
                </h1>
                <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed font-medium">
                  Join freelancer.langoleaf and gain access to top-tier university partnerships, industry-leading commission rates, and AI-powered recruitment tools.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    href="/signup"
                    className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg font-bold border-2 border-primary shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 rounded-2xl"
                  >
                    Start Your Journey <ArrowRight className="w-5 h-5" />
                  </Link>
                  <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 text-lg font-bold border-2 border-slate-900 dark:border-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 rounded-2xl">
                    Book a Demo
                  </button>
                </div>
                <div className="flex items-center gap-6 pt-4">
                  <div className="flex -space-x-3">
                    <div className="w-10 h-10 border-2 border-background-light dark:border-background-dark bg-slate-300 flex items-center justify-center text-xs font-bold">JD</div>
                    <div className="w-10 h-10 border-2 border-background-light dark:border-background-dark bg-slate-400 flex items-center justify-center text-xs font-bold">MK</div>
                    <div className="w-10 h-10 border-2 border-background-light dark:border-background-dark bg-slate-500 flex items-center justify-center text-xs font-bold">SR</div>
                    <div className="w-10 h-10 border-2 border-background-light dark:border-background-dark bg-primary flex items-center justify-center text-[10px] text-white font-black">+2k</div>
                  </div>
                  <p className="text-sm font-bold text-slate-500">Trusted by 2,000+ agents worldwide</p>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/20 blur-3xl opacity-50"></div>
                <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-slate-400/20 blur-3xl opacity-50"></div>
                <div className="relative border-2 border-dark-border shadow-2xl aspect-[4/3] bg-dark-surface overflow-hidden rounded-3xl">
                  <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/40 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6 p-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-2 border-dark-border rounded-2xl">
                    <div className="flex items-center gap-4">
                      <Globe className="text-primary w-10 h-10" />
                      <div>
                        <p className="text-sm font-black uppercase tracking-wide">Global Network</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Direct university access across 5 continents</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="py-12 bg-white dark:bg-dark-elevated border-y-2 border-dark-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              <div className="p-6 border-2 border-dark-border flex flex-col gap-2 hover:border-primary/50 transition-colors bg-dark-surface shadow-xl rounded-2xl">
                <Building2 className="text-primary w-8 h-8" />
                <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-wider">University Partners</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white">800+</p>
              </div>
              <div className="p-6 border-2 border-dark-border flex flex-col gap-2 hover:border-primary/50 transition-colors bg-dark-surface shadow-xl rounded-2xl">
                <Wallet className="text-primary w-8 h-8" />
                <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-wider">Commission Rate</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white">Up to 30%</p>
              </div>
              <div className="p-6 border-2 border-dark-border flex flex-col gap-2 hover:border-primary/50 transition-colors bg-dark-surface shadow-xl rounded-2xl">
                <Zap className="text-primary w-8 h-8" />
                <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-wider">Application Speed</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white">2.5x Faster</p>
              </div>
              <div className="p-6 border-2 border-dark-border flex flex-col gap-2 hover:border-primary/50 transition-colors bg-dark-surface shadow-xl rounded-2xl">
                <MapPin className="text-primary w-8 h-8" />
                <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-wider">Countries Covered</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white">120+</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Why Choose freelancer.langoleaf?</h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
                We provide the world-class infrastructure you need to scale your student recruitment business globally without the overhead.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-dark-surface p-8 border-2 border-dark-border shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[6px_6px_0px_0px_rgba(236,91,19,0.3)] hover:-translate-y-1 transition-all group">
                <div className="w-14 h-14 bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <Globe className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black mb-4 uppercase tracking-wide">Global Partnerships</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm font-medium">
                  Gain direct access to prestigious universities across UK, USA, Canada, and Australia. Skip the long contracts and start recruiting immediately.
                </p>
              </div>
              <div className="bg-dark-surface p-8 border-2 border-dark-border shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[6px_6px_0px_0px_rgba(236,91,19,0.3)] hover:-translate-y-1 transition-all group">
                <div className="w-14 h-14 bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black mb-4 uppercase tracking-wide">High Commissions</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm font-medium">
                  Earn significantly more with our transparent and competitive commission structures, paid securely and on time, every time.
                </p>
              </div>
              <div className="bg-dark-surface p-8 border-2 border-dark-border shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[6px_6px_0px_0px_rgba(236,91,19,0.3)] hover:-translate-y-1 transition-all group">
                <div className="w-14 h-14 bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <Zap className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black mb-4 uppercase tracking-wide">Advanced AI Tools</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm font-medium">
                  Streamline applications with our proprietary recruitment software and CRM, designed specifically for high-performing education agents.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Parent Brand Callout */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden bg-slate-900 dark:bg-primary/10 text-white p-8 md:p-16 flex flex-col lg:flex-row items-center gap-12 border-2 border-dark-border shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)]">
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent"></div>
              </div>
              <div className="relative z-10 flex-1 space-y-6">
                <div className="flex items-center gap-3">
                  <Award className="text-primary w-10 h-10" />
                  <h3 className="text-2xl font-black uppercase tracking-wide">Powered by langoleaf.com</h3>
                </div>
                <p className="text-slate-300 dark:text-slate-200 text-lg leading-relaxed max-w-xl font-medium">
                  Leverage the trust and reach of a global leader in education technology. freelancer.langoleaf is built on the proven infrastructure that has helped thousands of students study abroad.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button className="bg-primary hover:bg-primary/90 text-white px-6 py-3 font-bold border-2 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
                    Explore Langoleaf Ecosystem
                  </button>
                  <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 font-bold border-2 border-white/30 backdrop-blur-md transition-all">
                    Partner with Us
                  </button>
                </div>
              </div>
              <div className="relative z-10 w-full lg:w-1/3 aspect-video bg-dark-surface overflow-hidden border-2 border-white/10 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <TrendingUp className="w-16 h-16 text-primary/50" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 text-center">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <h2 className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">Ready to transform your recruitment business?</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 font-medium">Join the elite network of independent agents today and start earning more with freelancer.langoleaf.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                href="/signup"
                className="bg-primary hover:bg-primary/90 text-white px-12 py-5 text-xl font-bold border-2 border-primary shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all rounded-2xl"
              >
                Join freelancer.langoleaf Now
              </Link>
            </div>
            <p className="text-sm text-slate-500 font-bold italic">No setup fees. No hidden costs. Just growth.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-dark-elevated border-t-2 border-dark-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12">
            <div className="col-span-2 space-y-6">
              <div className="flex items-center gap-2">
                <School className="w-6 h-6 text-primary" />
                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  freelancer.<span className="text-primary">langoleaf</span>
                </h2>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-xs font-medium">
                The ultimate platform for independent education agents and freelancers to access global universities and high-yield commissions.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 border-2 border-dark-border flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-colors">
                  <Globe className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 border-2 border-dark-border flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-colors">
                  <Users className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-black text-sm uppercase tracking-widest">Platform</h4>
              <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
                <li><Link href="#" className="hover:text-primary">Partnerships</Link></li>
                <li><Link href="#" className="hover:text-primary">Commissions</Link></li>
                <li><Link href="#" className="hover:text-primary">AI Tools</Link></li>
                <li><Link href="#" className="hover:text-primary">University Portal</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-black text-sm uppercase tracking-widest">Company</h4>
              <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
                <li><Link href="#" className="hover:text-primary">About Langoleaf</Link></li>
                <li><Link href="#" className="hover:text-primary">Careers</Link></li>
                <li><Link href="#" className="hover:text-primary">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-primary">Terms of Service</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-black text-sm uppercase tracking-widest">Support</h4>
              <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
                <li><Link href="#" className="hover:text-primary">Help Center</Link></li>
                <li><Link href="#" className="hover:text-primary">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-primary">API Docs</Link></li>
                <li><Link href="#" className="hover:text-primary">Webinars</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t-2 border-dark-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-500 font-medium">© 2024 freelancer.langoleaf - A Sub-brand of langoleaf.com. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold">Global / English</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
