import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils/cn"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-none text-sm font-black uppercase tracking-wide transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF3000] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-black text-white border-2 border-black hover:bg-[#FF3000] hover:border-[#FF3000] hover:text-white",
        destructive: "bg-[#FF3000] text-white border-2 border-[#FF3000] hover:bg-black hover:border-black",
        outline: "bg-white text-black border-2 border-black hover:bg-black hover:text-white",
        secondary: "bg-[#F2F2F2] text-black border-2 border-black hover:bg-black hover:text-white",
        ghost: "bg-transparent text-black border-2 border-transparent hover:border-black",
        link: "bg-transparent text-black border-b-2 border-black hover:text-[#FF3000] hover:border-[#FF3000] pb-1",
        accent: "bg-[#FF3000] text-white border-2 border-[#FF3000] hover:bg-black hover:border-black",
      },
      size: {
        default: "h-12 px-6",
        sm: "h-10 px-4 text-xs",
        lg: "h-14 px-8 text-base",
        xl: "h-16 px-12 text-base",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
