import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils/cn"

const swissCardVariants = cva(
  "relative rounded-none transition-all duration-150 ease-out",
  {
    variants: {
      variant: {
        default: "bg-white border-2 border-black hover:bg-[#FF3000] hover:border-[#FF3000] hover:text-white group",
        muted: "bg-[#F2F2F2] border-2 border-black hover:bg-black hover:text-white group",
        accent: "bg-[#FF3000] border-2 border-[#FF3000] text-white hover:bg-black hover:border-black group",
        outline: "bg-transparent border-2 border-black hover:bg-black hover:text-white group",
        ghost: "bg-transparent border-2 border-transparent hover:border-black",
      },
      pattern: {
        none: "",
        grid: "swiss-grid-pattern",
        dots: "swiss-dots",
        diagonal: "swiss-diagonal",
      },
      borderWidth: {
        default: "border-2",
        thick: "border-4",
        thin: "border",
      },
    },
    defaultVariants: {
      variant: "default",
      pattern: "none",
      borderWidth: "default",
    },
  }
)

const swissCardPaddingVariants = cva("", {
  variants: {
    padding: {
      none: "",
      sm: "p-4",
      default: "p-6",
      md: "p-8",
      lg: "p-12",
      xl: "p-16",
    },
  },
  defaultVariants: {
    padding: "default",
  },
})

export interface SwissCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof swissCardVariants>,
    VariantProps<typeof swissCardPaddingVariants> {
  asChild?: boolean
}

const SwissCard = React.forwardRef<HTMLDivElement, SwissCardProps>(
  ({ className, variant, pattern, borderWidth, padding, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          swissCardVariants({ variant, pattern, borderWidth }),
          swissCardPaddingVariants({ padding }),
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SwissCard.displayName = "SwissCard"

// Swiss Card Header - for consistent card headers
const SwissCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 pb-4 border-b-2 border-black mb-4", className)}
    {...props}
  />
))
SwissCardHeader.displayName = "SwissCardHeader"

// Swiss Card Title - uppercase, bold
const SwissCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-black uppercase tracking-tight", className)}
    {...props}
  />
))
SwissCardTitle.displayName = "SwissCardTitle"

// Swiss Card Description - smaller, uppercase label
const SwissCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs font-bold uppercase tracking-widest text-black/60 group-hover:text-white/80", className)}
    {...props}
  />
))
SwissCardDescription.displayName = "SwissCardDescription"

// Swiss Card Content
const SwissCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
SwissCardContent.displayName = "SwissCardContent"

// Swiss Card Footer - with top border
const SwissCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4 border-t-2 border-black mt-4", className)}
    {...props}
  />
))
SwissCardFooter.displayName = "SwissCardFooter"

export {
  SwissCard,
  SwissCardHeader,
  SwissCardTitle,
  SwissCardDescription,
  SwissCardContent,
  SwissCardFooter,
  swissCardVariants,
}