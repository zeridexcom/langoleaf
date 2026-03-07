export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b-2 border-dark-border px-6 py-4 lg:px-20 bg-background-light dark:bg-background-dark">
        <div className="flex items-center gap-2">
          <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
          </svg>
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            freelancer.<span className="text-primary">langoleaf</span>
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-sm text-slate-500 dark:text-slate-400 font-medium">Don&apos;t have an account?</span>
          <a 
            href="/signup" 
            className="flex min-w-[100px] cursor-pointer items-center justify-center overflow-hidden h-10 px-5 bg-primary text-white text-sm font-bold border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            Sign Up
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 relative">
        {/* Background Decoration */}
        <div className="fixed -z-10 top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[100px] pointer-events-none"></div>
        <div className="fixed -z-10 bottom-0 left-0 w-[300px] h-[300px] bg-primary/5 blur-[80px] pointer-events-none"></div>
        
        <div className="w-full max-w-[480px]">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-6 lg:px-20 border-t-2 border-dark-border">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Secure 256-bit SSL encrypted connection</p>
          </div>
          <div className="flex gap-6 text-sm font-bold text-slate-500 dark:text-slate-400">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Help Center</a>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">© 2024 Langoleaf. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
