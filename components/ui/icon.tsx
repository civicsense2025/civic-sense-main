import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const iconVariants = cva("", {
  variants: {
    variant: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      primary: "text-primary",
      secondary: "text-secondary-foreground",
      accent: "text-accent",
      destructive: "text-destructive",
      success: "text-success",
      warning: "text-warning",
    },
    size: {
      xs: "size-3",
      sm: "size-4",
      default: "size-5",
      lg: "size-6",
      xl: "size-8",
      "2xl": "size-10",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

export interface IconProps
  extends React.SVGProps<SVGSVGElement>,
    VariantProps<typeof iconVariants> {
  children: React.ReactNode
}

const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        className={cn(iconVariants({ variant, size, className }))}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        {...props}
      >
        {children}
      </svg>
    )
  }
)
Icon.displayName = "Icon"

export { Icon, iconVariants } 