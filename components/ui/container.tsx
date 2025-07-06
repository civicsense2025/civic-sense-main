import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const containerVariants = cva("w-full", {
  variants: {
    size: {
      sm: "max-w-screen-sm",
      md: "max-w-screen-md",
      lg: "max-w-screen-lg",
      xl: "max-w-screen-xl",
      "2xl": "max-w-screen-2xl",
      full: "max-w-full",
      none: "",
    },
    padding: {
      none: "px-0",
      sm: "px-4 sm:px-6",
      md: "px-4 sm:px-6 md:px-8",
      lg: "px-4 sm:px-6 md:px-8 lg:px-12",
    },
    center: {
      true: "mx-auto",
      false: "",
    },
  },
  defaultVariants: {
    size: "xl",
    padding: "md",
    center: true,
  },
})

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  as?: "div" | "section" | "article" | "aside" | "main" | "header" | "footer"
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, padding, center, as = "div", ...props }, ref) => {
    const Comp = as
    return (
      <Comp
        ref={ref}
        className={cn(containerVariants({ size, padding, center, className }))}
        {...props}
      />
    )
  }
)
Container.displayName = "Container"

export { Container, containerVariants } 