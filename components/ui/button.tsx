import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium",
    "transition-all duration-150 ease-smooth",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    "active:scale-[0.97]",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-accent text-white rounded-lg shadow-sm hover:bg-accent-light hover:shadow-glow",
        secondary:
          "bg-surface-2 text-text-1 border border-border-2 rounded-lg hover:bg-elevated hover:border-text-3",
        outline:
          "border border-border-2 text-text-1 rounded-lg bg-transparent hover:bg-surface-2 hover:border-text-3",
        ghost:
          "text-text-2 rounded-lg hover:bg-surface-2 hover:text-text-1",
        danger:
          "bg-danger text-white rounded-lg shadow-sm hover:bg-danger/90 hover:shadow-md",
        teal:
          "bg-teal text-white rounded-lg shadow-sm hover:bg-teal-light hover:shadow-glow-teal",
        link:
          "text-accent underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm:   "h-8 px-3 text-xs gap-1.5",
        md:   "h-9 px-4 text-sm",
        default: "h-9 px-4 text-sm",
        lg:   "h-10 px-5 text-sm",
        xl:   "h-11 px-6 text-base",
        icon: "size-9 rounded-lg",
        "icon-sm": "size-8 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
