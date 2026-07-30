import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium tabular-nums whitespace-nowrap",
  {
    variants: {
      variant: {
        default:
          "border-accent/30 bg-accent/10 text-accent-light",
        secondary:
          "border-border-2 bg-surface-2 text-text-2",
        success:
          "border-success/30 bg-success/10 text-success",
        warning:
          "border-warning/30 bg-warning/10 text-warning",
        danger:
          "border-danger/30 bg-danger/10 text-danger",
        teal:
          "border-teal/30 bg-teal/10 text-teal-light",
        outline:
          "border-border-2 bg-transparent text-text-2",
        // Solid variants (for high-emphasis)
        "solid-success": "border-transparent bg-success text-white",
        "solid-danger":  "border-transparent bg-danger text-white",
        "solid-accent":  "border-transparent bg-accent text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
