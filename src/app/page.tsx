"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Globe, 
  TrendingUp, 
  Zap, 
  Users, 
  Award, 
  ArrowRight, 
  CheckCircle,
  Building2,
  MapPin,
  Plus
} from "lucide-react";
import { SwissSectionHeader } from "@/components/ui/swiss-section-header";
import { SwissCard } from "@/components/ui/swiss-card";
import { Button } from "@/components/ui/button";

function AuthCodeRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (code && !isRedirecting) {
      setIsRedirecting(true);
      window.location.replace(`/auth/callback?code=${code}`);
    }
  }, [searchParams, router, isRedirecting]);

  if (isRedirecting) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-black border-t-[#FF3000] animate-spin"></div>
          <p className="text-black font-black uppercase tracking-widest text-sm">Authenticating...</p>
        </div>
      </div>
    );
  }

  return null;
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={null}>
        <AuthCodeRedirect />
      </Suspense>

      {/* Navigation - Swiss Style */}
      <header className="sticky top-0 z-50 w-full border-b-2 border-black bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tighter text-black uppercase">
                  freelancer.<span className="text-[#FF3000]">langoleaf</span>
                </h2>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {["Partnerships", "Commissions", "Tools", "About"].map((item) => (
                <Link 
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="px-4 py-2 text-xs font-black uppercase tracking-widest text-black hover:bg-black hover:text-white transition-all duration-150 ease-out border-2 border-transparent hover:border-black"
                >
                  {item}
                </Link>
              ))}
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center gap-2">
              <Link 
                href="/login"
                className="hidden sm:flex px-5 py-2.5 text-xs font-black uppercase tracking-widest border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-all duration-150 ease-out"
              >
                Log In
              </Link>
              <Link 
                href="/signup"
                className="bg-[#FF3000] hover:bg-black text-white px-5 py-2.5 text-xs font-black uppercase tracking-widest border-2 border-[#FF3000] hover:border-black transition-all duration-150 ease-out"
              >
                Join Now
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section - Swiss Bauhaus Composition */}
        <section className="relative border-b-2 border-black">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-12 min-h-[80vh]">
              {/* Left Content - 7 columns */}
              <div className="lg:col-span-7 flex flex-col justify-center p-8 lg:p-16 border-r-2 border-black">
                {/* Section Label */}
                <div className="flex items-center gap-3 mb-8">
                  <span className="text-[#FF3000] font-black text-xs tracking-widest uppercase">01. Mission</span>
                  <div className="h-px flex-1 bg-black"></div>
                </div>

                {/* Main Headline - Massive */}
                <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black uppercase tracking-tighter leading-[0.9] mb-8">
                  Empowering<br />
                  <span className="text-[#FF3000]">Education</span><br />
                  Agents
                </h1>

                {/* Subheadline */}
                <p className="text-lg font-medium text-black/70 max-w-lg mb-8 leading-relaxed">
                  Join freelancer.langoleaf and gain access to top-tier university partnerships, 
                  industry-leading commission rates, and AI-powered recruitment tools.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mb-12">
                  <Link href="/signup">
                    <Button size="xl" className="w-full sm:w-auto">
                      Start Your Journey <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Button variant="outline" size="xl" className="w-full sm:w-auto">
                    Book a Demo
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {["JD", "MK", "SR", "+2K"].map((initial, i) => (
                      <div 
                        key={i}
                        className={`w-10 h-10 border-2 border-white flex items-center justify-center text-xs font-black ${
                          i === 3 ? "bg-[#FF3000] text-white" : "bg-black text-white"
                        }`}
                      >
                        {initial}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest text-black/60">
                    Trusted by 2,000+ agents worldwide
                  </p>
                </div>
              </div>

              {/* Right Visual - 5 columns with Bauhaus Composition */}
              <div className="lg:col-span-5 relative bg-[#F2F2F2] swiss-grid-pattern overflow-hidden">
                {/* Geometric Composition */}
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <div className="relative w-full max-w-sm aspect-square">
                    {/* Large Red Square */}
                    <div className="absolute top-0 right-0 w-3/4 h-3/4 bg-[#FF3000]"></div>
                    {/* Black Rectangle */}
                    <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-black"></div>
                    {/* White Square with Border */}
                    <div className="absolute top-1/4 left-1/4 w-1/3 h-1/3 bg-white border-4 border-black"></div>
                    {/* Small Red Circle */}
                    <div className="absolute bottom-1/4 right-1/4 w-16 h-16 bg-[#FF3000] rounded-full"></div>
                    {/* Typography Element */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <span className="text-6xl font-black text-white">800+</span>
                    </div>
                  </div>
                </div>

                {/* Floating Stats */}
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="bg-white border-2 border-black p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-[#FF3000] mb-1">Universities</p>
                    <p className="text-2xl font-black">Global Network</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section - 01. System */}
        <section className="border-b-2 border-black">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Building2, label: "University Partners", value: "800+", number: "01" },
                { icon: TrendingUp, label: "Commission Rate", value: "30%", number: "02" },
                { icon: Zap, label: "Application Speed", value: "2.5x", number: "03" },
                { icon: MapPin, label: "Countries", value: "120+", number: "04" },
              ].map((stat, i) => (
                <div 
                  key={i}
                  className={`p-8 border-b-2 lg:border-b-0 border-black hover:bg-[#FF3000] hover:text-white group transition-all duration-150 ease-out cursor-pointer ${
                    i < 3 ? "border-r-2" : ""
                  }`}
                >
                  <span className="text-[#FF3000] font-black text-xs tracking-widest uppercase group-hover:text-white/60 mb-4 block">
                    {stat.number}
                  </span>
                  <stat.icon className="w-8 h-8 mb-4 text-black group-hover:text-white" />
                  <p className="text-xs font-black uppercase tracking-widest text-black/60 group-hover:text-white/60 mb-2">
                    {stat.label}
                  </p>
                  <p className="text-4xl font-black">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section - 02. Method */}
        <section className="py-24 border-b-2 border-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SwissSectionHeader 
              number="02. Method"
              title="Why Choose Us"
              subtitle="We provide the world-class infrastructure you need to scale your student recruitment business globally without the overhead."
              className="mb-16"
            />

            <div className="grid md:grid-cols-3 gap-0 border-2 border-black">
              {[
                { 
                  icon: Globe, 
                  title: "Global Partnerships",
                  description: "Gain direct access to prestigious universities across UK, USA, Canada, and Australia. Skip the long contracts and start recruiting immediately."
                },
                { 
                  icon: TrendingUp, 
                  title: "High Commissions",
                  description: "Earn significantly more with our transparent and competitive commission structures, paid securely and on time, every time."
                },
                { 
                  icon: Zap, 
                  title: "AI-Powered Tools",
                  description: "Streamline applications with our proprietary recruitment software and CRM, designed specifically for high-performing education agents."
                },
              ].map((feature, i) => (
                <SwissCard 
                  key={i}
                  variant="default"
                  padding="lg"
                  className={`${i < 2 ? "border-r-2 border-black" : ""} border-b-2 md:border-b-0 border-black`}
                >
                  <div className="w-14 h-14 bg-black flex items-center justify-center text-white mb-6 group-hover:bg-white group-hover:text-black transition-all duration-150">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-4">{feature.title}</h3>
                  <p className="text-sm font-medium text-black/70 leading-relaxed group-hover:text-white/80">
                    {feature.description}
                  </p>
                </SwissCard>
              ))}
            </div>
          </div>
        </section>

        {/* Parent Brand Section - 03. Network */}
        <section className="border-b-2 border-black">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2">
              {/* Left Content */}
              <div className="p-8 lg:p-16 border-r-2 border-black">
                <span className="text-[#FF3000] font-black text-xs tracking-widest uppercase mb-4 block">03. Network</span>
                <div className="flex items-center gap-3 mb-6">
                  <Award className="w-10 h-10 text-black" />
                  <h3 className="text-2xl font-black uppercase tracking-tight">Powered by langoleaf.com</h3>
                </div>
                <p className="text-lg font-medium text-black/70 leading-relaxed mb-8">
                  Leverage the trust and reach of a global leader in education technology. 
                  freelancer.langoleaf is built on the proven infrastructure that has helped 
                  thousands of students study abroad.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button variant="accent">
                    Explore Ecosystem
                  </Button>
                  <Button variant="outline">
                    Partner with Us
                  </Button>
                </div>
              </div>

              {/* Right Visual - Diagonal Pattern */}
              <div className="relative bg-[#F2F2F2] swiss-diagonal min-h-[400px] lg:min-h-0">
                <div className="absolute inset-8 border-2 border-black bg-white flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="w-16 h-16 text-[#FF3000] mx-auto mb-4" />
                    <p className="text-4xl font-black">Global</p>
                    <p className="text-xs font-black uppercase tracking-widest text-black/60">Education Network</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section - 04. Action */}
        <section className="py-24 bg-black text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-[#FF3000] font-black text-xs tracking-widest uppercase mb-4 block">04. Action</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-none mb-8">
              Ready to Transform<br />Your Business?
            </h2>
            <p className="text-lg font-medium text-white/70 mb-12 max-w-2xl mx-auto">
              Join the elite network of independent agents today and start earning more with freelancer.langoleaf.
            </p>
            <Link href="/signup">
              <Button size="xl" variant="accent" className="text-lg">
                Join freelancer.langoleaf Now
              </Button>
            </Link>
            <p className="text-xs font-black uppercase tracking-widest text-white/40 mt-8">
              No setup fees. No hidden costs. Just growth.
            </p>
          </div>
        </section>
      </main>

      {/* Footer - Swiss Grid */}
      <footer className="bg-white border-t-2 border-black">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 border-b-2 border-black">
            {/* Brand Column */}
            <div className="col-span-2 p-8 border-r-2 border-black">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-black flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" fill="currentColor" />
                </div>
                <h2 className="text-lg font-black tracking-tighter text-black uppercase">
                  freelancer.<span className="text-[#FF3000]">langoleaf</span>
                </h2>
              </div>
              <p className="text-sm font-medium text-black/60 leading-relaxed max-w-xs mb-6">
                The ultimate platform for independent education agents and freelancers to access global universities and high-yield commissions.
              </p>
              <div className="flex gap-2">
                <a href="#" className="w-10 h-10 border-2 border-black flex items-center justify-center text-black hover:bg-black hover:text-white transition-all duration-150">
                  <Globe className="w-4 h-4" />
                </a>
                <a href="#" className="w-10 h-10 border-2 border-black flex items-center justify-center text-black hover:bg-black hover:text-white transition-all duration-150">
                  <Users className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Link Columns */}
            {[
              { title: "Platform", links: ["Partnerships", "Commissions", "AI Tools", "University Portal"] },
              { title: "Company", links: ["About Langoleaf", "Careers", "Privacy Policy", "Terms of Service"] },
              { title: "Support", links: ["Help Center", "Contact Us", "API Docs", "Webinars"] },
            ].map((column, i) => (
              <div key={i} className={`p-8 ${i < 2 ? "border-r-2 border-black" : ""}`}>
                <h4 className="font-black text-xs uppercase tracking-widest mb-4">{column.title}</h4>
                <ul className="space-y-3">
                  {column.links.map((link) => (
                    <li key={link}>
                      <Link href="#" className="text-sm font-medium text-black/60 hover:text-[#FF3000] transition-colors">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center p-6 gap-4">
            <p className="text-xs font-black uppercase tracking-widest text-black/40">
              © 2024 freelancer.langoleaf - A Sub-brand of langoleaf.com. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-black/40" />
              <span className="text-xs font-black uppercase tracking-widest text-black/40">Global / English</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}