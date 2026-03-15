import { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Standard Page Wrapper for the Partner Portal.
 * Use this to ensure all pages are automatically centered and have consistent padding.
 */
export function DashboardPageLayout({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("max-w-screen-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-8", className)}>
      {children}
    </div>
  );
}

/**
 * Standard Section Container for Dashboard panels.
 * Use this to ensure all cards have consistent border rhythm and shadows.
 */
export function SectionPanel({ children, title, action, className }: { 
  children: ReactNode; 
  title?: string; 
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("bg-white border border-gray-200 rounded-xl shadow-premium overflow-hidden", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          {title && <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">{title}</h3>}
          {action}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </section>
  );
}

/**
 * Grid system for future-proof column alignment.
 * 4 columns on large desktop, 2 on laptop/tablet, 1 on mobile.
 */
export function DashboardGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6", className)}>
      {children}
    </div>
  );
}
