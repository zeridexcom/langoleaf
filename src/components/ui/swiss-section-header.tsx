import * as React from "react"
import { cn } from "@/lib/utils/cn"

interface SwissSectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  number: string
  title: string
  subtitle?: string
  align?: "left" | "center" | "right"
  pattern?: "none" | "grid" | "dots" | "diagonal"
  showBorder?: boolean
}

const SwissSectionHeader = React.forwardRef<HTMLDivElement, SwissSectionHeaderProps>(
  ({ 
    className, 
    number, 
    title, 
    subtitle, 
    align = "left", 
    pattern = "none",
    showBorder = true,
    ...props 
  }, ref) => {
    const alignClasses = {
      left: "text-left items-start",
      center: "text-center items-center",
      right: "text-right items-end",
    }

    const patternClasses = {
      none: "",
      grid: "swiss-grid-pattern",
      dots: "swiss-dots",
      diagonal: "swiss-diagonal",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col space-y-4",
          alignClasses[align],
          patternClasses[pattern],
          showBorder && "border-b-4 border-black pb-6",
          className
        )}
        {...props}
      >
        {/* Section Number - Swiss Red */}
        <span className="text-[#FF3000] font-black text-sm tracking-widest uppercase">
          {number}
        </span>
        
        {/* Main Title - Massive Uppercase */}
        <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black uppercase tracking-tighter leading-none">
          {title}
        </h2>
        
        {/* Optional Subtitle */}
        {subtitle && (
          <p className="text-base md:text-lg font-medium text-black/70 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    )
  }
)
SwissSectionHeader.displayName = "SwissSectionHeader"

// Swiss Section Label - smaller version for subsections
interface SwissSectionLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  number: string
  label: string
}

const SwissSectionLabel = React.forwardRef<HTMLDivElement, SwissSectionLabelProps>(
  ({ className, number, label, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-4 border-b-2 border-black pb-2",
          className
        )}
        {...props}
      >
        <span className="text-[#FF3000] font-black text-xs tracking-widest uppercase">
          {number}
        </span>
        <span className="text-xs font-black uppercase tracking-widest text-black">
          {label}
        </span>
      </div>
    )
  }
)
SwissSectionLabel.displayName = "SwissSectionLabel"

// Swiss Divider - thick black line
const SwissDivider = React.forwardRef<
  HTMLHRElement,
  React.HTMLAttributes<HTMLHRElement> & { thickness?: "thin" | "default" | "thick" }
>(({ className, thickness = "default", ...props }, ref) => {
  const thicknessClasses = {
    thin: "border-t",
    default: "border-t-2",
    thick: "border-t-4",
  }

  return (
    <hr
      ref={ref}
      className={cn(
        "border-black w-full my-8",
        thicknessClasses[thickness],
        className
      )}
      {...props}
    />
  )
})
SwissDivider.displayName = "SwissDivider"

// Swiss Vertical Divider
const SwissVerticalDivider = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { thickness?: "thin" | "default" | "thick" }
>(({ className, thickness = "default", ...props }, ref) => {
  const thicknessClasses = {
    thin: "w-px",
    default: "w-0.5",
    thick: "w-1",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "bg-black h-full self-stretch",
        thicknessClasses[thickness],
        className
      )}
      {...props}
    />
  )
})
SwissVerticalDivider.displayName = "SwissVerticalDivider"

export {
  SwissSectionHeader,
  SwissSectionLabel,
  SwissDivider,
  SwissVerticalDivider,
}