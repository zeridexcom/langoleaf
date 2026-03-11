import { Zap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header - Swiss Style */}
      <header className="flex items-center justify-between border-b-2 border-black px-6 py-4 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <h2 className="text-xl font-black tracking-tighter text-black uppercase">
            freelancer.<span className="text-[#FF3000]">langoleaf</span>
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-xs font-black uppercase tracking-widest text-black/60">
            Don&apos;t have an account?
          </span>
          <a 
            href="/signup" 
            className="px-5 py-2.5 bg-[#FF3000] text-white text-xs font-black uppercase tracking-widest border-2 border-[#FF3000] hover:bg-black hover:border-black transition-all duration-150"
          >
            Sign Up
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 relative">
        <div className="w-full max-w-[480px]">
          {children}
        </div>
      </main>

      {/* Footer - Swiss Style */}
      <footer className="py-6 px-6 lg:px-12 border-t-2 border-black">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-black flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" fill="currentColor" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-black/60">
              Secure 256-bit SSL encrypted
            </p>
          </div>
          <div className="flex gap-6 text-xs font-black uppercase tracking-widest text-black/60">
            <a href="#" className="hover:text-[#FF3000] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#FF3000] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[#FF3000] transition-colors">Help Center</a>
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-black/60">
            © 2024 Langoleaf
          </p>
        </div>
      </footer>
    </div>
  );
}
