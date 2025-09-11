import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-transform duration-150 hover:scale-[1.03] active:scale-[0.97] hover:shadow-lg",
  {
    variants: {
      variant: {
        default: "bg-blue-700 text-white hover:bg-blue-800 focus-visible:bg-blue-800 shadow-md font-semibold",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 focus-visible:bg-red-700 shadow-md font-semibold",
        outline:
          "border-2 border-gray-700 bg-white text-gray-800 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-800 focus-visible:bg-gray-100 focus-visible:text-gray-900 shadow-sm font-medium",
        secondary:
          "bg-gray-700 text-white hover:bg-gray-800 focus-visible:bg-gray-800 shadow-md font-semibold",
        ghost: "text-gray-800 hover:bg-gray-200 hover:text-gray-900 focus-visible:bg-gray-200 focus-visible:text-gray-900 font-medium",
        link: "text-blue-700 underline-offset-4 hover:underline focus-visible:text-blue-800 font-medium hover:text-blue-800",
        hero: "bg-blue-700 text-white hover:bg-blue-800 focus-visible:bg-blue-800 text-base font-bold px-8 py-3 shadow-lg",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
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
