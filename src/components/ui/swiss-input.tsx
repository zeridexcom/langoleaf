import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils/cn"

const swissInputVariants = cva(
  "flex w-full rounded-none bg-transparent text-sm font-medium transition-all duration-150 ease-out file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-black/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-b-2 border-black focus-visible:border-[#FF3000] px-0 py-3",
        boxed: "border-2 border-black focus-visible:border-[#FF3000] px-4 py-3",
        underline: "border-b-2 border-black focus-visible:border-[#FF3000] px-0 py-3",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface SwissInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof swissInputVariants> {}

const SwissInput = React.forwardRef<HTMLInputElement, SwissInputProps>(
  ({ className, variant, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(swissInputVariants({ variant }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
SwissInput.displayName = "SwissInput"

// Swiss Label - uppercase, bold, tracking
const SwissLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-xs font-black uppercase tracking-widest text-black mb-2 block",
      className
    )}
    {...props}
  />
))
SwissLabel.displayName = "SwissLabel"

// Swiss Textarea
const SwissTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & VariantProps<typeof swissInputVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full rounded-none bg-transparent text-sm font-medium transition-all duration-150 ease-out placeholder:text-black/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none",
        variant === "boxed" && "border-2 border-black focus-visible:border-[#FF3000] px-4 py-3",
        variant === "underline" && "border-b-2 border-black focus-visible:border-[#FF3000] px-0 py-3",
        variant === "default" && "border-b-2 border-black focus-visible:border-[#FF3000] px-0 py-3",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
SwissTextarea.displayName = "SwissTextarea"

// Swiss Select
const SwissSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & VariantProps<typeof swissInputVariants>
>(({ className, variant, children, ...props }, ref) => {
  return (
    <select
      className={cn(
        "flex w-full rounded-none bg-transparent text-sm font-medium transition-all duration-150 ease-out focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer",
        variant === "boxed" && "border-2 border-black focus-visible:border-[#FF3000] px-4 py-3 pr-10",
        variant === "underline" && "border-b-2 border-black focus-visible:border-[#FF3000] px-0 py-3 pr-8",
        variant === "default" && "border-b-2 border-black focus-visible:border-[#FF3000] px-0 py-3 pr-8",
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  )
})
SwissSelect.displayName = "SwissSelect"

// Swiss Form Group - container with label and input
interface SwissFormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  htmlFor?: string
  error?: string
}

const SwissFormGroup = React.forwardRef<HTMLDivElement, SwissFormGroupProps>(
  ({ className, label, htmlFor, error, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        <SwissLabel htmlFor={htmlFor}>{label}</SwissLabel>
        {children}
        {error && (
          <p className="text-xs font-bold uppercase tracking-wide text-[#FF3000]">
            {error}
          </p>
        )}
      </div>
    )
  }
)
SwissFormGroup.displayName = "SwissFormGroup"

export {
  SwissInput,
  SwissLabel,
  SwissTextarea,
  SwissSelect,
  SwissFormGroup,
  swissInputVariants,
}